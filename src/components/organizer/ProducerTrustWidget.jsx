import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, TrendingUp, Shield, Users } from 'lucide-react';

export default function ProducerTrustWidget() {
  const stats = [
    {
      icon: Users,
      label: 'Global Payment Processing',
      value: '195 countries',
      color: 'text-blue-600'
    },
    {
      icon: TrendingUp,
      label: 'Annual Payment Volume',
      value: '$1T+',
      color: 'text-green-600'
    },
    {
      icon: Shield,
      label: 'Security Certifications',
      value: 'SOC 2, PCI-DSS',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Why Producers Trust BMore Connected</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-4 bg-card/60 border-border hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${stat.color} flex-shrink-0 mt-0.5`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-sm font-bold text-foreground mt-1">{stat.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Key features */}
      <Card className="p-4 bg-gradient-to-br from-green-50/50 to-blue-50/50 border-green-200/50">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Producer Advantages</h4>
          <ul className="space-y-1.5 text-xs">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span><strong>Competitive fees:</strong> 5% commission + $0.50/ticket (vs 2.5% + $0.99 elsewhere)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span><strong>Real-time analytics:</strong> Track sales, attendees, and revenue instantly</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span><strong>Built-in community:</strong> Reach local Baltimore audience directly</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span><strong>Marketing tools:</strong> Promo codes, bulk messaging, and audience insights</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span><strong>Fast payouts:</strong> Weekly deposits to your bank account</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span><strong>24/7 support:</strong> Dedicated producer support team</span>
            </li>
          </ul>
        </div>
      </Card>

      {/* Stripe certification */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/50 rounded-lg border border-blue-100">
        <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <div className="text-xs">
          <p className="font-semibold text-blue-900">Stripe Certified Platform</p>
          <p className="text-blue-700">Enterprise-grade payment security & compliance</p>
        </div>
      </div>
    </div>
  );
}