import React, { useState } from 'react';
import { Share2, Copy, Check, Facebook, Twitter, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PromoterSocialSharing({ event }) {
  const [copied, setCopied] = useState(false);
  const baseUrl = window.location.origin;
  const eventUrl = `${baseUrl}/events/${event.id}`;
  const eventTitle = event.title;
  const eventDescription = event.description || '';

  const socialLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out: ${eventTitle}`)}&url=${encodeURIComponent(eventUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openSocial = (url) => {
    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Promote on Social Media</h3>

      {/* Share Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          onClick={() => openSocial(socialLinks.facebook)}
          variant="outline"
          className="w-full flex flex-col items-center gap-2 h-auto py-3 rounded-lg border-[#1877F2]"
        >
          <Facebook className="w-5 h-5" style={{ color: '#1877F2' }} />
          <span className="text-xs">Facebook</span>
        </Button>
        <Button
          onClick={() => openSocial(socialLinks.twitter)}
          variant="outline"
          className="w-full flex flex-col items-center gap-2 h-auto py-3 rounded-lg border-[#000]"
        >
          <Twitter className="w-5 h-5" />
          <span className="text-xs">X (Twitter)</span>
        </Button>
        <Button
          onClick={() => openSocial(socialLinks.linkedin)}
          variant="outline"
          className="w-full flex flex-col items-center gap-2 h-auto py-3 rounded-lg border-[#0A66C2]"
        >
          <Linkedin className="w-5 h-5" style={{ color: '#0A66C2' }} />
          <span className="text-xs">LinkedIn</span>
        </Button>
      </div>

      {/* Event Link */}
      <div>
        <label className="text-sm font-medium text-foreground">Event Link</label>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={eventUrl}
            readOnly
            className="flex-1 px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button
            onClick={handleCopy}
            variant="outline"
            size="icon"
            className="rounded-lg"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Quick Share Text */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Share Message Template</label>
        <textarea
          defaultValue={`Check out "${eventTitle}" - ${eventDescription ? eventDescription.slice(0, 50) + '...' : 'an amazing event coming up!'}`}
          readOnly
          className="w-full px-3 py-2 rounded-lg border border-input bg-secondary/30 text-sm focus:outline-none resize-none"
          rows={3}
        />
        <p className="text-xs text-muted-foreground mt-1">Copy and customize this text for your social posts</p>
      </div>

      {/* Info Card */}
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
        <h4 className="font-medium text-sm text-foreground mb-2">Promotion Tips</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Post 2-3 weeks before for early awareness</li>
          <li>• Share updates as event date approaches</li>
          <li>• Include promotional codes in posts for tracking</li>
          <li>• Tag relevant communities and venues</li>
        </ul>
      </div>
    </div>
  );
}