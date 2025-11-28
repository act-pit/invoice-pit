import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { userId, priceId, userType, planType, billingCycle } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // デフォルト値の設定
    const finalPriceId = priceId || process.env.STRIPE_PRICE_TALENT_PREMIUM!;
    const finalUserType = userType || 'talent';
    const finalPlanType = planType || 'basic';
    const finalBillingCycle = billingCycle || 'monthly';

    // Get user profile
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://invoice-pit.com'}/${finalUserType}/subscription/success?plan=${finalPlanType}&billing_cycle=${finalBillingCycle}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://invoice-pit.com'}/${finalUserType}/subscription/cancelled`,
      customer_email: profile.email,
      metadata: {
        userId: userId,
        userType: finalUserType,
        planType: finalPlanType,
        billingCycle: finalBillingCycle,
      },
      subscription_data: {
        metadata: {
          userId: userId,
          userType: finalUserType,
          planType: finalPlanType,
          billingCycle: finalBillingCycle,
        },
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
