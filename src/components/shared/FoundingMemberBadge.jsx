import React from 'react';
import { Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function FoundingMemberBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-[10px] font-semibold border border-yellow-300 dark:border-yellow-700 cursor-default select-none">
            <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />
            Founding
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Founding Member — early supporter of Planet Baltimore</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}