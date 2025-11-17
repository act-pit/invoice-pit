// src/app/api/stripe/manage-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ユーザーのサブスクリプション情報を取得
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (action === 'cancel') {
      if (!subscription.stripe_subscription_id) {
        return NextResponse.json(
          { error: 'No active subscription' },
          { status: 400 }
        );
      }

      // Stripeでサブスクリプションをキャンセル（期間終了時）
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      return NextResponse.json({ 
        success: true,
        message: 'サブスクリプションは期間終了時にキャンセルされます'
      });
    }

    if (action === 'portal') {
      if (!subscription.stripe_customer_id) {
        return NextResponse.json(
          { error: 'No customer ID found' },
          { status: 400 }
        );
      }

      // Stripe顧客ポータルのURLを生成
      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/talent/subscription`,
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Manage subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
