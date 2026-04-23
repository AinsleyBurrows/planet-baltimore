import React, { useMemo } from 'react';
import { Search, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export default function ConversationSidebar({ conversations, activeId, onSelect, currentUserId, search, onSearch }) {
  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground mb-3">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search conversations..."
            className="pl-10 h-9 rounded-lg bg-secondary border-0 text-sm"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No conversations yet</p>
          </div>
        ) : (
          conversations.map((convo) => {
            const other = convo.other;
            const isActive = convo.conversation_id === activeId;
            const unread = convo.unreadCount > 0;

            return (
              <button
                key={convo.conversation_id}
                onClick={() => onSelect(convo)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-150 border-b border-border/50 hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-secondary ${isActive ? 'bg-accent/10 border-l-2 border-l-accent' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="w-11 h-11">
                    <AvatarImage src={other.avatar} />
                    <AvatarFallback className="bg-accent/10 text-accent font-semibold text-sm">
                      {other.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {unread && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-card" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-sm truncate ${unread ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                      {other.name}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {convo.lastMessage?.created_date
                        ? formatDistanceToNow(new Date(convo.lastMessage.created_date), { addSuffix: false })
                            .replace('about ', '')
                            .replace(' minutes', 'm')
                            .replace(' minute', 'm')
                            .replace(' hours', 'h')
                            .replace(' hour', 'h')
                            .replace(' days', 'd')
                            .replace(' day', 'd')
                        : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className={`text-xs truncate ${unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {convo.lastMessage?.sender_id === currentUserId ? 'You: ' : ''}
                      {convo.lastMessage?.content || ''}
                    </p>
                    {unread && (
                      <Badge className="ml-auto flex-shrink-0 w-4 h-4 p-0 flex items-center justify-center bg-accent text-accent-foreground text-[10px] rounded-full">
                        {convo.unreadCount}
                      </Badge>
                    )}
                  </div>
                  {other.type && (
                    <span className="text-[10px] text-accent/70 capitalize">{other.type.replace('_', ' ')}</span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}