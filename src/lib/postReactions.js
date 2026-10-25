import { base44 } from '@/api/base44Client';

/* Every post card needs to know whether the reader liked and saved that post.
   Asked card by card, that is two list requests per post — a feed of thirty
   posts would spend sixty of the reader's requests. The asks are collected for
   a tick here and answered with two queries covering every post on screen. */
const pending = new Map();
let flushTimer = null;

const flush = async () => {
  flushTimer = null;
  const batches = [...pending.entries()];
  pending.clear();

  await Promise.all(
    batches.map(async ([userId, batch]) => {
      const ids = [...batch.ids];
      try {
        const [likes, saves] = await Promise.all([
          base44.entities.Like.filter({ user_id: userId, target_type: 'post', target_id: { $in: ids } }),
          base44.entities.SavedPost.filter({ user_id: userId, post_id: { $in: ids } }),
        ]);
        const likedIds = new Set(likes.map((row) => row.target_id));
        const savedIds = new Set(saves.map((row) => row.post_id));

        batch.waiters.forEach((waiters, postId) => {
          const answer = { liked: likedIds.has(postId), saved: savedIds.has(postId) };
          waiters.forEach(({ resolve }) => resolve(answer));
        });
      } catch (error) {
        batch.waiters.forEach((waiters) => waiters.forEach(({ reject }) => reject(error)));
      }
    })
  );
};

export const fetchPostReaction = (userId, postId) =>
  new Promise((resolve, reject) => {
    const batch = pending.get(userId) || { ids: new Set(), waiters: new Map() };
    const waiters = batch.waiters.get(postId) || [];
    waiters.push({ resolve, reject });
    batch.waiters.set(postId, waiters);
    batch.ids.add(postId);
    pending.set(userId, batch);
    if (!flushTimer) flushTimer = setTimeout(flush, 40);
  });