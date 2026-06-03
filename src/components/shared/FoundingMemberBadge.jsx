import React from 'react';
import { Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function FoundingMemberBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-transparent text-yellow-600 dark:text-yellow-400 text-[10px] font-semibold border border-yellow-400 dark:border-yellow-500 cursor-default select-none">
            <Star className="w-2.5 h-2.5 text-yellow-500 dark:text-yellow-400" />
            Founding Member
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Founding Member — early supporter of Planet Baltimore</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}