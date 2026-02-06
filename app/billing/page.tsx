'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, CreditCard, Calendar, CheckCircle, Clock, Mail, Download, Crown, Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

type Subscription = {
  plan_type: 'weekly' | 'annual';
  status: 'active' | 'canceled' | 'past_due';
  current_period_end: string;
  created_at: string;
  stripe_subscription_id?: string;
} | null;

export default function BillingPage() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [loading, setLoading] = useState(true);
  const [daysActive, setDaysActive] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({ id: user.id, email: user.email || '' });
        fetchSubscription(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan_type, status, current_period_end, created_at, stripe_subscription_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (data && !error) {
        setSubscription(data);
        // Calculate days active
        const startDate = new Date(data.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysActive(diffDays);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const getPlanPrice = (planType: string) => {
    switch (planType) {
      case 'weekly': return '$9.99/week';
      case 'annual': return '$99.99/year';
      default: return '$9.99/week';
    }
  };

  const getPlanLabel = (planType: string) => {
    switch (planType) {
      case 'weekly': return 'Pro Weekly';
      case 'annual': return 'Pro Annual';
      default: return 'Pro';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-600 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-600 flex items-center justify-center">
        <Card className="bg-white/95 backdrop-blur rounded-3xl p-8 text-center">
          <p className="text-gray-700 mb-4">Please sign in to view billing</p>
          <Button asChild>
            <Link href="/profile">Sign In</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-600">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/profile" className="flex items-center gap-2 text-white/80 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
            Back
          </Link>
          <Logo />
        </div>

        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Billing & Receipts
        </h1>

        {subscription ? (
          <div className="space-y-6">
            {/* Current Plan Card */}
            <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Crown className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-xl">{getPlanLabel(subscription.plan_type)}</p>
                    <p className="text-green-100">{getPlanPrice(subscription.plan_type)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-100">
                  <CheckCircle className="h-4 w-4" />
                  <span>Active</span>
                </div>
              </CardContent>
            </Card>

            {/* Billing Details */}
            <Card className="bg-white/10 backdrop-blur border-white/20 rounded-3xl">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-bold text-white text-lg">Subscription Details</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/60 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Start Date
                    </span>
                    <span className="text-white font-medium">
                      {new Date(subscription.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/60 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Next Renewal
                    </span>
                    <span className="text-white font-medium">
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/60 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Price
                    </span>
                    <span className="text-white font-medium">
                      {getPlanPrice(subscription.plan_type)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-white/60 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Status
                    </span>
                    <span className="text-green-400 font-medium">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Days Active - Value Reinforcement */}
            {daysActive > 0 && (
              <Card className="bg-purple-500/20 backdrop-blur border-purple-500/30 rounded-3xl">
                <CardContent className="p-6 text-center">
                  <p className="text-purple-200 text-sm mb-1">You&apos;ve been using Verified Replies for</p>
                  <p className="text-white text-3xl font-bold">{daysActive} {daysActive === 1 ? 'day' : 'days'}</p>
                </CardContent>
              </Card>
            )}

            {/* Receipts Section */}
            <Card className="bg-white/10 backdrop-blur border-white/20 rounded-3xl">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-bold text-white text-lg flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Receipts
                </h2>
                
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <Mail className="h-4 w-4" />
                  <span>Receipts are emailed automatically to {user.email}</span>
                </div>
                
                <p className="text-white/50 text-sm">
                  Your payment receipts are sent to your email after each successful charge. 
                  Check your inbox (and spam folder) for receipts from Stripe.
                </p>

                <a
                  href={`mailto:gulalabs1@gmail.com?subject=Receipt Request - ${user.email}&body=${encodeURIComponent(
                    `Hi, I'd like to request a copy of my receipt.\n\nEmail: ${user.email}\nPlan: ${getPlanLabel(subscription.plan_type)}\n\nThank you!`
                  )}`}
                  className="inline-flex items-center gap-2 text-purple-300 hover:text-white text-sm transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Need a receipt? Contact us
                </a>
              </CardContent>
            </Card>

            {/* Manage via Stripe Portal */}
            <div className="text-center pt-4 space-y-3">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/stripe/portal', { method: 'POST' });
                    const data = await res.json();
                    if (data.url) {
                      window.location.href = data.url;
                    } else {
                      toast({ title: 'Error', description: 'Could not open billing portal', variant: 'destructive' });
                    }
                  } catch {
                    toast({ title: 'Error', description: 'Could not open billing portal', variant: 'destructive' });
                  }
                }}
                className="text-purple-300 hover:text-white text-sm font-medium transition-colors"
              >
                Manage subscription in Stripe →
              </button>
            </div>
          </div>
        ) : (
          <Card className="bg-white/10 backdrop-blur border-white/20 rounded-3xl">
            <CardContent className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-purple-300 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">No active subscription</p>
              <p className="text-purple-200 text-sm mb-4">Upgrade to Pro to see billing details</p>
              <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                <Link href="/pricing">View Plans</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
