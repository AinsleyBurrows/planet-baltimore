import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingFlow from './OnboardingFlow';

export default function OnboardingModal({ currentUser, onComplete }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-8"
        >
          {/* Wordmark */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-lg font-bold text-accent">Planet</span>
            <span className="text-lg font-light text-foreground">Baltimore</span>
          </div>

          <OnboardingFlow currentUser={currentUser} onComplete={onComplete} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}