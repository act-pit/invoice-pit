// api/stripe/webhook/route.ts
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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.userId;
  const userType = session.metadata?.userType || 'talent';
  const planType = session.metadata?.planType || 'basic';
  const billingCycle = session.metadata?.billingCycle || 'monthly'; // ← 追加

  if (!userId) {
    console.error('Missing userId in checkout session metadata');
    break;
  }

  // サブスクリプション情報を取得
  const subscriptionId = typeof session.subscription === 'string' 
    ? session.subscription 
    : session.subscription?.id;

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // subscriptionsテーブルを更新
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        plan: planType,
        billing_cycle: billingCycle, // ← 追加
        stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
        stripe_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('user_type', userType);

    if (error) {
      console.error('Error updating subscription:', error);
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      );
    }

    console.log(`✅ Subscription activated for user ${userId} (${userType}), Plan: ${planType}, Billing: ${billingCycle}`); // ← ログ改善
  }
  break;
}

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const userType = subscription.metadata?.userType;

        if (!userId || !userType) {
          console.error('Missing metadata in subscription');
          break;
        }

        let status: 'active' | 'canceled' | 'expired' = 'active';
        if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
          status = 'canceled';
        } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
          status = 'expired';
        }

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: status,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
          .eq('user_type', userType);

        if (error) {
          console.error('Error updating subscription:', error);
        } else {
          console.log(`Subscription updated for user ${userId}: ${status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const userType = subscription.metadata?.userType;

        if (!userId || !userType) {
          console.error('Missing metadata in subscription');
          break;
        }

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            plan: 'free',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
          .eq('user_type', userType);

        if (error) {
          console.error('Error canceling subscription:', error);
        } else {
          console.log(`Subscription canceled for user ${userId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        const subscriptionId = (invoice as any).subscription as string | undefined;
        const paymentIntentId = (invoice as any).payment_intent as string | undefined;

        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const userId = subscription.metadata?.userId;

            if (userId) {
              const { error } = await supabase.from('payment_history').insert({
                talent_id: userId,
                stripe_payment_intent_id: paymentIntentId || null,
                amount: invoice.amount_paid,
                currency: invoice.currency,
                status: 'succeeded',
              });

              if (error) {
                console.error('Error recording payment:', error);
              } else {
                console.log(`Payment recorded for user ${userId}`);
              }
            }
          } catch (err) {
            console.error('Error processing payment success:', err);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        const subscriptionId = (invoice as any).subscription as string | undefined;
        const paymentIntentId = (invoice as any).payment_intent as string | undefined;

        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const userId = subscription.metadata?.userId;

            if (userId) {
              const { error } = await supabase.from('payment_history').insert({
                talent_id: userId,
                stripe_payment_intent_id: paymentIntentId || null,
                amount: invoice.amount_due,
                currency: invoice.currency,
                status: 'failed',
              });

              if (error) {
                console.error('Error recording failed payment:', error);
              } else {
                console.log(`Payment failed for user ${userId}`);
              }
            }
          } catch (err) {
            console.error('Error processing payment failure:', err);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
