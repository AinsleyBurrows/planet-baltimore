import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Are my payment details secure?',
    a: 'Yes. BMore Connected uses Stripe for payment processing, which is PCI DSS Level 1 compliant (the highest standard). Your credit card information is never stored on our servers.'
  },
  {
    q: 'When will I receive my tickets?',
    a: 'You\'ll receive a confirmation email immediately after checkout with your tickets and QR codes. You can also view your tickets anytime in your profile.'
  },
  {
    q: 'Can I transfer my ticket to someone else?',
    a: 'Currently tickets are tied to the buyer. For transfers, please contact the event organizer directly.'
  },
  {
    q: 'What if the event is cancelled?',
    a: 'If an event is cancelled, you\'ll receive a full refund automatically. We guarantee 100% money-back if the event doesn\'t happen.'
  },
  {
    q: 'How do I request a refund?',
    a: 'You can request a refund through your profile under "My Tickets". Event organizers review refund requests within 24-48 hours. Approved refunds process within 2-5 business days.'
  },
  {
    q: 'Is there a service fee?',
    a: 'Yes. Event organizers pay a small platform fee (typically 5% + $0.50 per ticket) to cover payment processing and platform costs. This is not added to your ticket price.'
  },
  {
    q: 'What if I have questions about an event?',
    a: 'Contact the event organizer directly using the email or contact information on the event page. You can also reach our support team for platform-related questions.'
  }
];

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors text-left"
      >
        <p className="font-medium text-foreground text-sm">{question}</p>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 py-3 bg-secondary/20 border-t border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function BuyerTrustSection() {
  return (
    <div className="space-y-6 mt-8 border-t border-border pt-8">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-2">Buyer Protection & Trust</h2>
        <p className="text-sm text-muted-foreground">Your safety and satisfaction matter. Here's what we guarantee.</p>
      </div>

      {/* Trust guarantees */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-green-50/50 border-green-200 text-sm">
          <div className="font-bold text-green-900 mb-1">🔒 100% Secure</div>
          <p className="text-green-700">Enterprise-grade encryption and PCI compliance</p>
        </Card>
        <Card className="p-4 bg-blue-50/50 border-blue-200 text-sm">
          <div className="font-bold text-blue-900 mb-1">💰 Money-Back</div>
          <p className="text-blue-700">Full refund if event is cancelled</p>
        </Card>
        <Card className="p-4 bg-purple-50/50 border-purple-200 text-sm">
          <div className="font-bold text-purple-900 mb-1">⚡ Instant Delivery</div>
          <p className="text-purple-700">Tickets emailed within seconds of purchase</p>
        </Card>
      </div>

      {/* FAQ */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Frequently Asked Questions</h3>
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <FAQItem key={idx} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>

      {/* Support info */}
      <Card className="p-4 bg-secondary/30 border-border">
        <h4 className="font-semibold text-foreground mb-2">Need Help?</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Have questions about your order or the event? We're here to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 text-xs">
          <a href="mailto:support@bmorconnected.com" className="text-accent hover:underline font-medium">
            📧 support@bmorconnected.com
          </a>
          <span className="text-muted-foreground">·</span>
          <a href="tel:+14105551234" className="text-accent hover:underline font-medium">
            📞 (410) 555-1234
          </a>
        </div>
      </Card>

      {/* Stripe badge */}
      <div className="text-center pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Payment processing powered by</p>
        <svg className="w-24 h-6 mx-auto" viewBox="0 0 60 24" fill="none">
          <text x="10" y="16" fontSize="14" fontWeight="bold" fill="currentColor" className="text-foreground">
            Stripe
          </text>
        </svg>
        <p className="text-xs text-muted-foreground mt-2">
          Trusted by 95% of Fortune 500 companies for secure payments
        </p>
      </div>
    </div>
  );
}