import React from 'react';
import { Card } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

const features = [
  {
    feature: 'Commission Rate',
    bmore: '5% + $0.50',
    competitors: '2.5% + $0.99'
  },
  {
    feature: 'Community Features',
    bmore: '✓ Built-in',
    competitors: '✗ Not included'
  },
  {
    feature: 'Local Focus',
    bmore: '✓ Baltimore first',
    competitors: '✗ National only'
  },
  {
    feature: 'Marketing Tools',
    bmore: '✓ Promo codes, bulk mail',
    competitors: '✓ Limited'
  },
  {
    feature: 'Check-In System',
    bmore: '✓ Free included',
    competitors: '✓ Add-on fee'
  },
  {
    feature: 'Support',
    bmore: '✓ 24/7 local team',
    competitors: '✓ Email only'
  },
  {
    feature: 'Setup Fees',
    bmore: '✓ None',
    competitors: '✗ $99-299'
  },
];

export default function ComparisonWidget() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-foreground mb-2">Why BMore Connected Wins</h3>
        <p className="text-sm text-muted-foreground">Fair pricing and local community first</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-3 font-semibold text-foreground">Feature</th>
              <th className="text-center py-3 px-3 font-semibold text-accent">BMore Connected</th>
              <th className="text-center py-3 px-3 font-semibold text-muted-foreground">Competitors</th>
            </tr>
          </thead>
          <tbody>
            {features.map((row, idx) => (
              <tr key={idx} className={`border-b border-border ${idx % 2 === 0 ? 'bg-secondary/20' : ''}`}>
                <td className="py-3 px-3 text-foreground">{row.feature}</td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-flex items-center justify-center">
                    {row.bmore.startsWith('✓') ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <span className="font-semibold text-accent">{row.bmore}</span>
                    )}
                  </span>
                </td>
                <td className="py-3 px-3 text-center text-muted-foreground text-xs">
                  {row.competitors.startsWith('✗') ? (
                    <X className="w-5 h-5 text-destructive mx-auto" />
                  ) : (
                    <span>{row.competitors}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card className="p-4 bg-green-50/50 border-green-200">
        <p className="text-sm text-green-900">
          <strong>💡 Pro Tip:</strong> Unlike national platforms, BMore Connected invests commission revenue back into the Baltimore arts and events community through partnerships and features that help local producers succeed.
        </p>
      </Card>
    </div>
  );
}