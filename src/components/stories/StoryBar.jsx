import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import StoryViewer from './StoryViewer.jsx';
import AddStoryModal from './AddStoryModal.jsx';

function isExpired(story) {
  if (!story.expires_at) return false;
  return new Date(story.expires_at) < new Date();
}

export default function StoryBar({ currentUser }) {
  const [viewingStories, setViewingStories] = useState(null); // array of stories to view
  const [viewingIndex, setViewingIndex] = useState(0);
  const [addingStory, setAddingStory] = useState(false);

  const { data: allStories = [] } = useQuery({
    queryKey: ['ephemeral-stories'],
    queryFn: () => base44.entities.EphemeralStory.list('-created_date', 100),
    refetchInterval: 60000,
  });

  // Filter out expired, group by author
  const activeStories = allStories.filter(s => !isExpired(s));

  const grouped = activeStories.reduce((acc, story) => {
    if (!acc[story.author_id]) {
      acc[story.author_id] = {
        author_id: story.author_id,
        author_name: story.author_name,
        author_avatar: story.author_avatar,
        stories: [],
      };
    }
    acc[story.author_id].stories.push(story);
    return acc;
  }, {});

  const groups = Object.values(grouped);

  // Put current user's group first
  const sorted = [
    ...groups.filter(g => g.author_id === currentUser?.id),
    ...groups.filter(g => g.author_id !== currentUser?.id),
  ];

  const openStories = (group, idx = 0) => {
    setViewingStories(group.stories);
    setViewingIndex(idx);
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {/* Other users' stories */}
        {sorted.filter(g => g.author_id !== currentUser?.id).map((group) => (
          <button
            key={group.author_id}
            onClick={() => openStories(group)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 focus:outline-none"
          >
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-accent via-coral to-gold">
              <div className="w-full h-full rounded-full border-2 border-card overflow-hidden">
                <Avatar className="w-full h-full">
                  <AvatarImage src={group.author_avatar} className="object-cover" />
                  <AvatarFallback className="bg-secondary text-foreground font-semibold text-lg">
                    {group.author_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-[11px] text-foreground font-medium max-w-[64px] truncate text-center">
              {group.author_name?.split(' ')[0]}
            </span>
          </button>
        ))}

        {/* Current user's stories if any */}
        {sorted.filter(g => g.author_id === currentUser?.id && g.stories.length > 0).map((group) => (
          <button
            key={`my-${group.author_id}`}
            onClick={() => openStories(group)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 focus:outline-none"
          >
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-accent to-gold">
              <div className="w-full h-full rounded-full border-2 border-card overflow-hidden">
                <Avatar className="w-full h-full">
                  <AvatarImage src={group.author_avatar} />
                  <AvatarFallback className="bg-accent/10 text-accent font-bold">
                    {group.author_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-[11px] text-foreground font-medium max-w-[64px] truncate text-center">Your story</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {viewingStories && (
          <StoryViewer
            stories={viewingStories}
            startIndex={viewingIndex}
            onClose={() => setViewingStories(null)}
          />
        )}
        {addingStory && (
          <AddStoryModal user={currentUser} onClose={() => setAddingStory(false)} />
        )}
      </AnimatePresence>
    </>
  );
}