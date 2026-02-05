import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
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
          // Get subscription details to determine plan type
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = subscription.items.data[0]?.price?.id;
          
          // Determine plan type from price ID
          let planType = 'weekly';
          if (priceId === process.env.STRIPE_PRICE_ID_MONTHLY) planType = 'monthly';
          if (priceId === process.env.STRIPE_PRICE_ID_ANNUAL) planType = 'annual';

          // Get user_id from metadata (we'll add this to checkout)
          const userId = session.metadata?.user_id;

          if (userId) {
            const { error } = await getSupabase()
              .from('subscriptions')
              .upsert({
                user_id: userId,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string,
                plan_type: planType,
                status: 'active',
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              }, { onConflict: 'user_id' });

            if (error) {
              console.error('Error storing subscription:', error);
            }

            // Mark user as beta tester if they used FAMTEST7 coupon
            if (subscription.discount?.coupon?.name === 'FAMTEST7') {
              const { error: betaError } = await getSupabase()
                .from('subscriptions')
                .update({ is_beta_tester: true })
                .eq('user_id', userId);
              
              if (betaError) {
                console.error('Error marking beta tester:', betaError);
              } else {
                console.log('Marked user as beta tester:', userId);
              }
            }
          }
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription created:', subscription.id);
        
        // Get user_id from subscription metadata
        const userId = subscription.metadata?.user_id;
        
        if (userId) {
          // Update profiles table to mark user as Pro
          const { error: profileError } = await getSupabase()
            .from('profiles')
            .upsert({
              id: userId,
              plan: 'pro',
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });
          
          if (profileError) {
            console.error('Error updating profile to pro:', profileError);
          }

          // Check for beta tester coupon
          if (subscription.discount?.coupon?.name === 'FAMTEST7') {
            await getSupabase()
              .from('profiles')
              .update({ beta_group: 'friends_family' })
              .eq('id', userId);
            console.log('Marked user as friends_family beta:', userId);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const { error } = await getSupabase()
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Failed to update subscription:', error);
        }
        
        // Also update profiles table based on status
        if (subscription.status === 'active') {
          const userId = subscription.metadata?.user_id;
          if (userId) {
            await getSupabase()
              .from('profiles')
              .upsert({ id: userId, plan: 'pro', updated_at: new Date().toISOString() }, { onConflict: 'id' });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const { error } = await getSupabase()
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Failed to cancel subscription:', error);
        }
        
        // Downgrade profile plan to free
        const userId = subscription.metadata?.user_id;
        if (userId) {
          await getSupabase()
            .from('profiles')
            .update({ plan: 'free', updated_at: new Date().toISOString() })
            .eq('id', userId);
          console.log('Downgraded user to free:', userId);
        }
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
