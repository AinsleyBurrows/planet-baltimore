import React from 'react';
import { Handshake, Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SPONSOR_TIERS = [
  { name: 'Presenting Sponsor', color: 'bg-accent text-accent-foreground' },
  { name: 'Premier Sponsor', color: 'bg-foreground text-background' },
  { name: 'Community Partner', color: 'bg-secondary text-secondary-foreground' },
];

const SAMPLE_SPONSORS = [
  { name: 'Baltimore Office of Promotion & The Arts', tier: 0 },
  { name: 'Mayor\'s Office of Art & Culture', tier: 0 },
  { name: 'Whiting-Turner', tier: 1 },
  { name: 'BGE', tier: 1 },
  { name: 'Kaiser Permanente', tier: 1 },
  { name: 'CareFirst', tier: 2 },
  { name: 'APG Federal Credit Union', tier: 2 },
  { name: 'WBAL-TV', tier: 2 },
];

export default function FestivalSponsors() {
  return (
    <div className="space-y-8">
      {/* Sponsor wall */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Handshake className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold text-foreground">Our Sponsors</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Baltimore's festivals are made possible through the generous support of our community partners.
        </p>

        <div className="space-y-6">
          {SPONSOR_TIERS.map((tier, tierIdx) => {
            const tierSponsors = SAMPLE_SPONSORS.filter(s => s.tier === tierIdx);
            if (tierSponsors.length === 0) return null;
            return (
              <div key={tier.name}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${tier.color}`}>
                    {tier.name}
                  </span>
                </div>
                <div className={`grid gap-3 ${tierIdx === 0 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
                  {tierSponsors.map(sponsor => (
                    <div
                      key={sponsor.name}
                      className="bg-card border border-border rounded-xl p-4 flex items-center justify-center text-center min-h-[80px]"
                    >
                      <span className="text-sm font-medium text-foreground line-clamp-2">{sponsor.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Become a sponsor CTA */}
      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6 sm:p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
          <Heart className="w-6 h-6 text-accent" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">Become a Sponsor</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
          Support Baltimore's vibrant creative community while connecting with thousands of festival attendees.
          We offer customizable sponsorship packages for businesses of all sizes.
        </p>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
          Sponsor a Festival
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}