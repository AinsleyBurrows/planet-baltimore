import React from 'react';
import { MapPin, Globe, Phone, Mail, Clock, Info } from 'lucide-react';

export default function GovAboutTab({ agency }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5">
      <div>
        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-accent" /> About</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{agency.description || 'No description provided.'}</p>
      </div>

      {agency.mission && (
        <div className="bg-accent/5 border border-accent/10 rounded-xl p-4">
          <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">Mission</p>
          <p className="text-sm text-foreground leading-relaxed">{agency.mission}</p>
        </div>
      )}

      {agency.jurisdiction_area && (
        <div>
          <h3 className="font-semibold text-foreground mb-1 text-sm">Jurisdiction / Service Area</h3>
          <p className="text-sm text-muted-foreground">{agency.jurisdiction_area}</p>
        </div>
      )}

      {agency.address && (
        <div>
          <h3 className="font-semibold text-foreground mb-1 text-sm">Address</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {agency.address}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {agency.phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" /> <a href={`tel:${agency.phone}`} className="text-accent hover:underline">{agency.phone}</a></div>}
        {agency.contact_email && <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" /> <a href={`mailto:${agency.contact_email}`} className="text-accent hover:underline">{agency.contact_email}</a></div>}
        {agency.hours && <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-muted-foreground" /> {agency.hours}</div>}
        {agency.website && <div className="flex items-center gap-2 text-sm"><Globe className="w-4 h-4 text-muted-foreground" /> <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{agency.website}</a></div>}
      </div>

      {agency.tags?.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-2 text-sm">Tags</h3>
          <div className="flex flex-wrap gap-1.5">
            {agency.tags.map((t, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">#{t}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}