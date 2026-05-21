import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, CalendarPlus, Star, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import RSVPFormModal from './RSVPFormModal';
import AddToCalendarButton from '@/components/shared/AddToCalendarButton';

export default function RSVPButton({ eventId, event }) {
  const [user, setUser] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null); // triggers modal
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: existingRsvp } = useQuery({
    queryKey: ['rsvp', eventId, user?.id],
    queryFn: () => base44.entities.RSVP.filter({ user_id: user.id, event_id: eventId }),
    enabled: !!user?.id,
    select: data => data?.[0] || null,
  });

  const { data: attendees = [] } = useQuery({
    queryKey: ['rsvps', eventId],
    queryFn: () => base44.entities.RSVP.filter({ event_id: eventId }),
  });

  const goingCount = attendees.filter(r => r.status === 'going').length;
  const interestedCount = attendees.filter(r => r.status === 'interested').length;

  const rsvpMutation = useMutation({
    mutationFn: async ({ status, attendeeInfo }) => {
      if (existingRsvp) {
        if (existingRsvp.status === status && !attendeeInfo) {
          // Un-RSVP (no modal, direct toggle)
          await base44.entities.RSVP.delete(existingRsvp.id);
          return null;
        }
        return base44.entities.RSVP.update(existingRsvp.id, {
          status,
          attendee_name: attendeeInfo?.name,
          attendee_email: attendeeInfo?.email,
          attendee_phone: attendeeInfo?.phone,
          attendee_city: attendeeInfo?.city,
        });
      }
      return base44.entities.RSVP.create({
        user_id: user.id,
        event_id: eventId,
        status,
        attendee_name: attendeeInfo?.name,
        attendee_email: attendeeInfo?.email,
        attendee_phone: attendeeInfo?.phone,
        attendee_city: attendeeInfo?.city,
      });
    },
    onSuccess: (result, vars) => {
      queryClient.invalidateQueries({ queryKey: ['rsvp', eventId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['rsvps', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      setPendingStatus(null);
      if (vars.attendeeInfo && vars.status === 'going' && result) {
        // Send e-ticket via email and DM
        base44.functions.invoke('sendRSVPConfirmation', {
          eventId,
          attendeeInfo: vars.attendeeInfo,
        }).catch(() => {});
        toast({ title: `RSVP confirmed! 🎟️ Your e-ticket is on its way.` });
      } else {
        toast({ title: vars.attendeeInfo ? `RSVP confirmed! You're marked as ${vars.status}.` : 'RSVP removed' });
      }
    },
  });

  const handleRsvpClick = (status) => {
    // If already has this status — un-RSVP directly (no form needed)
    if (existingRsvp?.status === status) {
      rsvpMutation.mutate({ status });
      return;
    }
    // Otherwise show form to collect info
    setPendingStatus(status);
  };

  const handleFormConfirm = (attendeeInfo) => {
    rsvpMutation.mutate({ status: pendingStatus, attendeeInfo });
  };

  const currentStatus = existingRsvp?.status;

  if (!user) {
    return (
      <Button className="flex-1 h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground gap-2" disabled>
        <CalendarPlus className="w-4 h-4" />RSVP
      </Button>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col gap-2">
      <div className="flex gap-1">
        <Button
          onClick={() => handleRsvpClick('going')}
          disabled={rsvpMutation.isPending}
          className={`flex-1 h-12 rounded-l-xl rounded-r-none gap-2 font-semibold transition-all duration-150 active:scale-[0.98] ${
            currentStatus === 'going'
              ? 'bg-accent hover:bg-accent/90 text-accent-foreground'
              : 'bg-secondary hover:bg-secondary/80 text-foreground'
          }`}
        >
          {rsvpMutation.isPending && pendingStatus === 'going' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : currentStatus === 'going' ? (
            <CalendarCheck className="w-4 h-4" />
          ) : (
            <CalendarPlus className="w-4 h-4" />
          )}
          {currentStatus === 'going' ? 'Going ✓' : 'RSVP'}
          {goingCount > 0 && <span className="text-xs font-normal opacity-75">· {goingCount}</span>}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className={`h-12 w-10 rounded-l-none rounded-r-xl px-0 ${
                currentStatus === 'interested'
                  ? 'bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30'
                  : 'bg-secondary hover:bg-secondary/80 text-foreground'
              }`}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleRsvpClick('going')} className="gap-2">
              <CalendarCheck className="w-4 h-4 text-accent" />
              Going {currentStatus === 'going' && '✓'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRsvpClick('interested')} className="gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Interested {currentStatus === 'interested' && '✓'}
              {interestedCount > 0 && <span className="ml-auto text-xs text-muted-foreground">{interestedCount}</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {currentStatus === 'going' && event && (
        <AddToCalendarButton event={event} className="w-full" size="sm" />
      )}
      </div>

      {pendingStatus && (
        <RSVPFormModal
          status={pendingStatus}
          loading={rsvpMutation.isPending}
          onConfirm={handleFormConfirm}
          onClose={() => setPendingStatus(null)}
        />
      )}
    </>
  );
}