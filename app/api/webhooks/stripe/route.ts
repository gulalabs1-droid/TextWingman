import { NextRequest, NextResponse } from 'next/server';
import { planForStripePriceId, stripe } from '@/lib/stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

let supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('Checkout completed:', session.id);
        
        if (session.customer && session.subscription) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = subscription.items.data[0]?.price?.id;
          
          // Never guess a plan when Stripe sends an unknown or legacy price.
          const planType = planForStripePriceId(priceId) || 'unknown';
          if (planType === 'unknown') {
            console.error('Unsupported Stripe price on checkout:', { sessionId: session.id, priceId });
          }

          // Get user_id from client_reference_id (preferred) or metadata
          const userId = session.client_reference_id || session.metadata?.user_id;

          if (userId) {
            // Upsert subscription - Stripe is the ONLY writer
            const { error } = await getSupabase()
              .from('subscriptions')
              .upsert({
                user_id: userId,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string,
                plan_type: planType,
                price_id: priceId,
                status: subscription.status,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
                canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
                is_beta_tester: subscription.discount?.coupon?.name === 'FAMTEST7',
                updated_at: new Date().toISOString(),
              }, { onConflict: 'user_id' });

            if (error) {
              console.error('Error storing subscription:', error);
            } else {
              console.log('Subscription stored for user:', userId, 'plan:', planType);
            }
          } else {
            console.error('No user_id found in checkout session:', session.id);
          }
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription created:', subscription.id);
        
        const priceId = subscription.items.data[0]?.price?.id;
        const planType = planForStripePriceId(priceId) || 'unknown';
        if (planType === 'unknown') {
          console.error('Unsupported Stripe price on subscription create:', { subscriptionId: subscription.id, priceId });
        }
        
        // Get user_id from subscription metadata
        const userId = subscription.metadata?.user_id;
        
        if (userId) {
          // Upsert subscription - Stripe is the ONLY writer
          const { error } = await getSupabase()
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
              plan_type: planType,
              price_id: priceId,
              status: subscription.status,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
              is_beta_tester: subscription.discount?.coupon?.name === 'FAMTEST7',
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
          
          if (error) {
            console.error('Error storing subscription:', error);
          } else {
            console.log('Subscription created for user:', userId);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscription.id, 'status:', subscription.status);
        
        const priceId = subscription.items.data[0]?.price?.id;
        const planType = planForStripePriceId(priceId) || 'unknown';
        if (planType === 'unknown') {
          console.error('Unsupported Stripe price on subscription update:', { subscriptionId: subscription.id, priceId });
        }
        
        // Update subscription - Stripe is the ONLY writer
        const { error } = await getSupabase()
          .from('subscriptions')
          .update({
            status: subscription.status,
            plan_type: planType,
            price_id: priceId,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Failed to update subscription:', error);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', subscription.id);
        
        // Update subscription status - Stripe is the ONLY writer
        const { error } = await getSupabase()
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Failed to cancel subscription:', error);
        }
        // NOTE: Do NOT update profiles.plan here - app reads subscriptions.status directly
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
