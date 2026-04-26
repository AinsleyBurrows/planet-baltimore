import React from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function TicketQRCode({ ticket, eventTitle }) {
  const [copied, setCopied] = useState(false);

  const ticketData = JSON.stringify({
    ticket_id: ticket.id,
    ticket_number: ticket.ticket_number,
    unique_code: ticket.unique_code,
    event: eventTitle,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(ticketData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-secondary/30 rounded-xl border border-border">
      <div className="text-center w-full">
        <p className="font-semibold text-foreground text-sm">{ticket.ticket_number}</p>
        <p className="text-xs text-muted-foreground font-mono break-all mt-1">{ticket.unique_code}</p>
      </div>
      <div className="w-full p-3 bg-card rounded-lg border border-border">
        <p className="text-xs text-muted-foreground break-all font-mono">{ticketData}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="gap-1.5 w-full"
      >
        {copied ? (
          <><Check className="w-3.5 h-3.5" />Copied</>
        ) : (
          <><Copy className="w-3.5 h-3.5" />Copy Code</>
        )}
      </Button>
    </div>
  );
}