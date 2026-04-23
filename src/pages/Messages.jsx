import React from 'react';
import { MessageCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Messages() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Messages</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search conversations..." className="pl-10 h-11 rounded-xl bg-secondary border-0" />
      </div>

      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-7 h-7 text-accent" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">No messages yet</h3>
        <p className="text-sm text-muted-foreground">Start a conversation with someone in your community.</p>
      </div>
    </div>
  );
}