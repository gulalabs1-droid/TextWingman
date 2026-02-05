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
      className="w-full block bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-colors group text-left disabled:opacity-50"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center">
          {loading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <CreditCard className="h-6 w-6 text-white" />
          )}
        </div>
        <div>
          <h3 className="font-medium text-white/80 group-hover:text-white transition-colors">
            {loading ? 'Opening Portal...' : 'Manage Subscription'}
          </h3>
          <p className="text-sm text-white/50">View billing and plan details</p>
        </div>
      </div>
    </button>
  );
}
