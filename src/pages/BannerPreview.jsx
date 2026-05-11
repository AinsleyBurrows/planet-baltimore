import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BANNERS = [
  {
    id: 1,
    label: 'Golden Hour — Inner Harbor',
    url: 'https://media.base44.com/images/public/69ea6b08dd7ab098a7066584/d4fc1c1ab_generated_image.png',
    animation: 'pan-right',
  },
  {
    id: 2,
    label: 'Night Cityscape — Downtown',
    url: 'https://media.base44.com/images/public/69ea6b08dd7ab098a7066584/cf8709d4a_generated_image.png',
    animation: 'zoom-in',
  },
  {
    id: 3,
    label: 'Street Level — Rowhouses & Murals',
    url: 'https://media.base44.com/images/public/69ea6b08dd7ab098a7066584/f3a9b2364_generated_image.png',
    animation: 'pan-left',
  },
];

function AnimatedBanner({ banner, isActive }) {
  const panRight = {
    initial: { scale: 1.08, x: '-3%' },
    animate: { scale: 1.08, x: '3%', transition: { duration: 18, ease: 'linear', repeat: Infinity, repeatType: 'mirror' } },
  };
  const zoomIn = {
    initial: { scale: 1.0 },
    animate: { scale: 1.1, transition: { duration: 18, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' } },
  };
  const panLeft = {
    initial: { scale: 1.08, x: '3%' },
    animate: { scale: 1.08, x: '-3%', transition: { duration: 18, ease: 'linear', repeat: Infinity, repeatType: 'mirror' } },
  };
  const anim = banner.animation === 'pan-right' ? panRight : banner.animation === 'zoom-in' ? zoomIn : panLeft;

  return (
    <div className="relative w-full aspect-[16/5] rounded-2xl overflow-hidden shadow-2xl">
      <motion.img
        src={banner.url}
        alt={banner.label}
        className="absolute inset-0 w-full h-full object-cover"
        initial={anim.initial}
        animate={anim.animate}
      />
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-white/70 mb-1">Baltimore</p>
          <h2 className="text-xl sm:text-3xl font-serif font-bold text-white drop-shadow">{banner.label}</h2>
        </motion.div>
      </div>
    </div>
  );
}

export default function BannerPreview() {
  const [active, setActive] = useState(0);

  // Auto-cycle every 6s
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % BANNERS.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 space-y-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Baltimore Banner Options</h1>
          <p className="text-sm text-muted-foreground">Three animated banner styles — click any to focus it, or they auto-cycle.</p>
        </div>

        {/* Featured / active banner large */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatedBanner banner={BANNERS[active]} isActive />
          </motion.div>
        </AnimatePresence>

        {/* Thumbnails */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {BANNERS.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setActive(i)}
              className={`relative aspect-[16/9] rounded-xl overflow-hidden shadow transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${i === active ? 'ring-2 ring-accent scale-[1.03]' : 'opacity-70 hover:opacity-100 hover:scale-[1.02]'}`}
            >
              <img src={b.url} alt={b.label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20" />
              <p className="absolute bottom-1.5 left-2 right-2 text-[10px] sm:text-xs text-white font-medium line-clamp-1 drop-shadow">{b.label}</p>
              {i === active && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent shadow" />
              )}
            </button>
          ))}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`rounded-full transition-all duration-200 ${i === active ? 'w-6 h-2 bg-accent' : 'w-2 h-2 bg-muted-foreground/40 hover:bg-muted-foreground/70'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}