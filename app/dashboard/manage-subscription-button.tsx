'use client';

import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';

export default function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No portal URL returned:', data.error);
        alert('Unable to open billing portal. Please try again.');
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      alert('Unable to open billing portal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleManageSubscription}
      disabled={loading}
      className="w-full block rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 hover:bg-white/[0.06] transition-all group text-left disabled:opacity-50"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white/[0.06] rounded-xl flex items-center justify-center">
          {loading ? (
            <Loader2 className="h-5 w-5 text-white/50 animate-spin" />
          ) : (
            <CreditCard className="h-5 w-5 text-white/40" />
          )}
        </div>
        <div>
          <h3 className="font-bold text-sm text-white/60 group-hover:text-white/80 transition-colors">
            {loading ? 'Opening Portal...' : 'Manage Subscription'}
          </h3>
          <p className="text-xs text-white/25">View billing and plan details</p>
        </div>
      </div>
    </button>
  );
}
