import React from 'react';
import QRCode from 'qrcode.react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TicketQRCode({ ticket, eventTitle }) {
  const qrValue = JSON.stringify({
    ticket_id: ticket.id,
    ticket_number: ticket.ticket_number,
    unique_code: ticket.unique_code,
    event: eventTitle,
  });

  const handleDownload = () => {
    const qrElement = document.getElementById(`qr-${ticket.id}`);
    const canvas = qrElement.querySelector('canvas');
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-${ticket.ticket_number}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-secondary/30 rounded-xl">
      <div id={`qr-${ticket.id}`} className="p-3 bg-white rounded-lg">
        <QRCode
          value={qrValue}
          size={200}
          level="H"
          includeMargin={true}
          renderAs="canvas"
        />
      </div>
      <div className="text-center text-sm">
        <p className="font-semibold text-foreground">{ticket.ticket_number}</p>
        <p className="text-xs text-muted-foreground">{ticket.unique_code}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        className="gap-1.5"
      >
        <Download className="w-3.5 h-3.5" />
        Download
      </Button>
    </div>
  );
}