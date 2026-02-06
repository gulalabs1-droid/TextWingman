import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRICING } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json();

    if (!plan || !['weekly', 'annual'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Server-side auth — get real user, don't trust client-supplied userId
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in first.' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const userEmail = user.email || '';

    const planConfig = PRICING[plan as keyof typeof PRICING];
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/app?success=true`,
      cancel_url: `${origin}/app?canceled=true`,
      allow_promotion_codes: true,
      customer_email: userEmail || undefined,
      // CRITICAL: These fields link the checkout to the Supabase user
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        email: userEmail,
      },
      // Pass user_id to subscription metadata for webhook access
      subscription_data: {
        metadata: {
          user_id: userId,
          email: userEmail,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
