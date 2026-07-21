import React, { useState } from 'react';
import { Share2, Check, Link2 } from 'lucide-react';

export default function ShareButton({ url, title, description, size = 'sm', className = '' }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = { title: title || 'Planet Baltimore', text: description || '', url: url || window.location.href };
    if (navigator.share) {
      try { await navigator.share(shareData); return; } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(); }}
      className={`flex items-center gap-1.5 rounded-lg border border-border text-xs font-medium transition-colors px-2.5 py-1.5 hover:bg-secondary hover:text-foreground ${className}`}
      aria-label="Share"
    >
      {copied ? <><Check className="w-3.5 h-3.5" />Copied</> : <><Share2 className="w-3.5 h-3.5" />Share</>}
    </button>
  );
}