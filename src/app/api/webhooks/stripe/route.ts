import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const subscriptionId = session.subscription as string;

      if (userId && subscriptionId) {
        // Update user's subscription status
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_id: subscriptionId,
            subscription_start_date: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('Error updating profile:', error);
          return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
          );
        }

        console.log(`Subscription activated for user ${userId}`);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        let status: 'active' | 'inactive' | 'cancelled' = 'active';
        
        if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
          status = 'cancelled';
        } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
          status = 'inactive';
        }

        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: status,
          })
          .eq('subscription_id', subscription.id);

        if (error) {
          console.error('Error updating subscription:', error);
        } else {
          console.log(`Subscription updated for user ${userId}: ${status}`);
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'cancelled',
        })
        .eq('subscription_id', subscription.id);

      if (error) {
        console.error('Error canceling subscription:', error);
      } else {
        console.log(`Subscription cancelled: ${subscription.id}`);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
