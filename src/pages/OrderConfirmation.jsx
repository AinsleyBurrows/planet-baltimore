import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, Home, ArrowRight } from 'lucide-react';
import AppImage from '@/components/shared/AppImage';
import { format } from 'date-fns';

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch order by session ID (would need a backend function for this)
  // For now, redirect after payment success

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Order not found</p>
          <Link to="/events">
            <Button className="bg-accent hover:bg-accent/90">Back to Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Success message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Purchase Confirmed!</h1>
          <p className="text-muted-foreground mb-1">Your tickets have been sent to your email</p>
          <p className="text-sm text-muted-foreground">Session ID: {sessionId.slice(0, 20)}...</p>
        </div>

        {/* Next steps card */}
        <div className="bg-card rounded-xl border border-border p-6 sm:p-8 mb-8 space-y-4">
          <h2 className="font-semibold text-foreground">What's Next?</h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold flex-shrink-0">1</div>
              <div>
                <p className="font-medium text-foreground">Check your email</p>
                <p className="text-sm text-muted-foreground">Confirmation and tickets have been sent</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold flex-shrink-0">2</div>
              <div>
                <p className="font-medium text-foreground">Save your tickets</p>
                <p className="text-sm text-muted-foreground">View them anytime in your profile or on your phone</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold flex-shrink-0">3</div>
              <div>
                <p className="font-medium text-foreground">Arrive early</p>
                <p className="text-sm text-muted-foreground">Have your QR code or ticket ID ready at check-in</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="space-y-3">
          <Link to="/profile" className="block">
            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-12 gap-2">
              <Download className="w-5 h-5" />
              View My Tickets
            </Button>
          </Link>
          <Link to="/" className="block">
            <Button variant="outline" className="w-full h-12 gap-2">
              <Home className="w-5 h-5" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Help section */}
        <div className="mt-12 p-6 rounded-xl bg-secondary/40 border border-border">
          <p className="font-semibold text-foreground mb-3">Need Help?</p>
          <p className="text-sm text-muted-foreground mb-4">
            If you didn't receive a confirmation email or have questions about your tickets, please check your spam folder or contact the event organizer.
          </p>
          <a href="mailto:support@bmore-connected.com" className="text-sm text-accent hover:underline">
            Contact Support →
          </a>
        </div>
      </div>
    </div>
  );
}