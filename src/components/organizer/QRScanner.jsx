import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function QRScanner({ onScan }) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const divId = 'qr-reader';

  const start = async () => {
    setError('');
    const scanner = new Html5Qrcode(divId);
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          // brief pause after each scan to avoid duplicates
          scanner.pause(true);
          setTimeout(() => { try { scanner.resume(); } catch {} }, 2000);
        },
        () => {}
      );
      setActive(true);
    } catch (err) {
      setError('Camera access denied or unavailable.');
    }
  };

  const stop = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setActive(false);
  };

  useEffect(() => {
    return () => { stop(); };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        id={divId}
        className="w-full max-w-sm rounded-2xl overflow-hidden border border-border bg-black"
        style={{ minHeight: active ? 300 : 0 }}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        onClick={active ? stop : start}
        className={active
          ? 'bg-secondary text-foreground hover:bg-secondary/80 gap-2'
          : 'bg-accent hover:bg-accent/90 text-accent-foreground gap-2'
        }
      >
        {active ? <><CameraOff className="w-4 h-4" /> Stop Scanner</> : <><Camera className="w-4 h-4" /> Start Camera Scanner</>}
      </Button>
    </div>
  );
}