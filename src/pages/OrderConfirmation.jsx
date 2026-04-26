import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('session_id');
    setSessionId(id);
    
    if (id) {
      // In a real app, fetch order details from backend
      // For now, show success screen
      setOrderDetails({
        orderNumber: `ORD-${Date.now()}`,
        total: 125.00,
        ticketCount: 2,
      });
    }
  }, []);

  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground">Your tickets are on the way to your email</p>
      </div>

      {orderDetails && (
        <div className="bg-card border border-border rounded-xl p-6 text-left space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order Number</span>
            <span className="font-semibold text-foreground">{orderDetails.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tickets</span>
            <span className="font-semibold text-foreground">{orderDetails.ticketCount}</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between">
            <span className="font-semibold text-foreground">Total Paid</span>
            <span className="font-bold text-accent text-lg">${orderDetails.total.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="space-y-3 pt-4">
        <Button onClick={() => navigate('/')} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg gap-2">
          <Home className="w-4 h-4" /> Back to Home
        </Button>
        <Button variant="outline" className="w-full rounded-lg gap-2">
          <Download className="w-4 h-4" /> Download Tickets
        </Button>
      </div>
    </div>
  );
}