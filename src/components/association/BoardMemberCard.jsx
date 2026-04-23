import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Edit3, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const ROLE_LABELS = {
  president: 'President',
  vice_president: 'Vice President',
  treasurer: 'Treasurer',
  secretary: 'Secretary',
  board_member: 'Board Member',
  committee_chair: 'Committee Chair',
  other: 'Member',
};

const ROLE_COLORS = {
  president: 'bg-gold/10 text-yellow-700',
  vice_president: 'bg-primary/10 text-primary',
  treasurer: 'bg-green-500/10 text-green-700',
  secretary: 'bg-blue-500/10 text-blue-700',
  board_member: 'bg-secondary text-muted-foreground',
  committee_chair: 'bg-accent/10 text-accent',
  other: 'bg-secondary text-muted-foreground',
};

export default function BoardMemberCard({ member, isAdmin, onEdit, onDelete }) {
  const roleLabel = member.custom_role || ROLE_LABELS[member.role] || member.role;
  const roleColor = ROLE_COLORS[member.role] || ROLE_COLORS.other;

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <Avatar className="w-12 h-12 flex-shrink-0">
          <AvatarImage src={member.photo_url} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">{member.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{member.name}</p>
          <Badge className={`text-[10px] mt-0.5 border-0 ${roleColor}`}>{roleLabel}</Badge>
          {member.term_start && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Term: {format(new Date(member.term_start), 'MMM yyyy')}
              {member.term_end ? ` – ${format(new Date(member.term_end), 'MMM yyyy')}` : ' – Present'}
            </p>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-1">
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {member.bio && <p className="text-xs text-muted-foreground leading-relaxed">{member.bio}</p>}

      {member.show_contact && member.email && (
        <a href={`mailto:${member.email}`} className="flex items-center gap-1.5 text-xs text-accent hover:underline">
          <Mail className="w-3 h-3" />{member.email}
        </a>
      )}
    </div>
  );
}