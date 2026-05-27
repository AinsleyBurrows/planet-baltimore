import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCheck, Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format, isToday, isYesterday } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function linkifyMessage(text, isOwn) {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) =>
    URL_REGEX.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline break-all hover:opacity-80 ${isOwn ? 'text-accent-foreground/90' : 'text-accent'}`}
        onClick={e => e.stopPropagation()}
      >
        {part}
      </a>
    ) : part
  );
}

function MessageBubble({ msg, isOwn }) {
  const time = msg.created_date ? format(new Date(msg.created_date), 'h:mm a') : '';

  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && (
        <Avatar className="w-7 h-7 flex-shrink-0 mb-1">
          <AvatarImage src={msg.sender_avatar} />
          <AvatarFallback className="bg-accent/10 text-accent text-xs">{msg.sender_name?.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[72%] group`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isOwn
              ? 'bg-accent text-accent-foreground rounded-br-sm'
              : 'bg-card border border-border text-foreground rounded-bl-sm'
          }`}
        >
          {linkifyMessage(msg.content, isOwn)}
        </div>
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-muted-foreground">{time}</span>
          {isOwn && (
            msg.is_read
              ? <CheckCheck className="w-3 h-3 text-accent" />
              : <Check className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );
}

function DateDivider({ date }) {
  const label = isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'MMMM d, yyyy');
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground px-2">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function ChatWindow({ conversation, messages, currentUser, onBack }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();
  const other = conversation.other;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark unread messages as read
  useEffect(() => {
    const unread = messages.filter(m => !m.is_read && m.sender_id !== currentUser.id);
    unread.forEach(m => {
      base44.entities.Message.update(m.id, { is_read: true, read_at: new Date().toISOString() });
    });
    if (unread.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  }, [messages, currentUser.id]);

  const sendMutation = useMutation({
    mutationFn: (content) => base44.entities.Message.create({
      conversation_id: conversation.conversation_id,
      sender_id: currentUser.id,
      sender_name: currentUser.full_name || currentUser.display_name,
      sender_avatar: currentUser.avatar_url,
      recipient_id: other.id,
      recipient_name: other.name,
      recipient_avatar: other.avatar,
      recipient_type: other.type || 'user',
      content,
      is_read: false,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendMutation.mutate(text);
  };

  // Group messages by date
  const grouped = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const d = msg.created_date ? new Date(msg.created_date) : null;
    const dayKey = d ? format(d, 'yyyy-MM-dd') : 'unknown';
    if (dayKey !== lastDate) {
      grouped.push({ type: 'date', date: d, key: dayKey });
      lastDate = dayKey;
    }
    grouped.push({ type: 'message', msg });
  });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={onBack} className="md:hidden p-1.5 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Link to={`/profile/${other.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
          <Avatar className="w-10 h-10">
            <AvatarImage src={other.avatar} />
            <AvatarFallback className="bg-accent/10 text-accent font-semibold">{other.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{other.name}</p>
            {other.type && <p className="text-xs text-muted-foreground capitalize">{other.type.replace('_', ' ')}</p>}
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {grouped.map((item, i) =>
          item.type === 'date' ? (
            item.date && <DateDivider key={item.key} date={item.date} />
          ) : (
            <MessageBubble
              key={item.msg.id}
              msg={item.msg}
              isOwn={item.msg.sender_id === currentUser.id}
            />
          )
        )}
        {messages.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Send a message to start the conversation!
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card">
        <div className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={`Message ${other.name}...`}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className="w-8 h-8 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}