import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { normalizeEmail } from '@/lib/normalizeEmail';
import {
  SIGNUP_BONUS_CREDITS,
  CREDIT_COST,
  SUBSCRIPTION_PLANS,
} from '@/lib/credits/constants';

function db() {
  return getSupabaseServer(isValidServiceRoleKey());
}

export async function getActiveSubscription(userEmail) {
  const email = normalizeEmail(userEmail);
  if (!email) return null;

  const supabase = db();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_email', email)
    .eq('status', 'active')
    .gt('expires_at', now)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('getActiveSubscription', error);
    return null;
  }
  return data;
}

export async function hasUnlimitedAccess(userEmail) {
  const sub = await getActiveSubscription(userEmail);
  return Boolean(sub);
}

export async function getWallet(userEmail) {
  const email = normalizeEmail(userEmail);
  if (!email) return { credits: 0, signupBonusGranted: false };

  const supabase = db();
  const { data, error } = await supabase
    .from('user_wallet')
    .select('credits_balance, signup_bonus_granted')
    .eq('user_email', email)
    .maybeSingle();

  if (error?.code === '42P01') {
    return { credits: 0, signupBonusGranted: false, tableMissing: true };
  }

  return {
    credits: data?.credits_balance ?? 0,
    signupBonusGranted: Boolean(data?.signup_bonus_granted),
  };
}

export async function grantSignupBonus(userEmail) {
  const email = normalizeEmail(userEmail);
  if (!email) return { granted: false, credits: 0 };

  const supabase = db();
  const wallet = await getWallet(email);

  if (wallet.signupBonusGranted) {
    return { granted: false, credits: wallet.credits, alreadyGranted: true };
  }

  const newBalance = wallet.credits + SIGNUP_BONUS_CREDITS;

  const { error: upsertErr } = await supabase.from('user_wallet').upsert(
    {
      user_email: email,
      credits_balance: newBalance,
      signup_bonus_granted: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_email' }
  );

  if (upsertErr) {
    console.error('grantSignupBonus upsert', upsertErr);
    throw upsertErr;
  }

  await supabase.from('credit_ledger').insert({
    user_email: email,
    delta: SIGNUP_BONUS_CREDITS,
    reason: 'signup_bonus',
    reference_type: 'signup',
    idempotency_key: `signup_bonus:${email}`,
  });

  return { granted: true, credits: newBalance };
}

async function deductCredits(email, amount, meta) {
  const supabase = db();

  if (meta.idempotencyKey) {
    const { data: existing } = await supabase
      .from('credit_ledger')
      .select('id')
      .eq('idempotency_key', meta.idempotencyKey)
      .maybeSingle();
    if (existing) {
      const wallet = await getWallet(email);
      return { ok: true, credits: wallet.credits, duplicate: true };
    }
  }

  const wallet = await getWallet(email);
  if (wallet.credits < amount) {
    return { ok: false, reason: 'insufficient_credits', credits: wallet.credits };
  }

  const newBalance = wallet.credits - amount;
  const now = new Date().toISOString();

  // Atomic decrement: only update if balance is still sufficient (avoids race double-spend)
  const { data: updated, error: updateErr } = await supabase
    .from('user_wallet')
    .update({
      credits_balance: newBalance,
      updated_at: now,
    })
    .eq('user_email', email)
    .gte('credits_balance', amount)
    .select('credits_balance, signup_bonus_granted')
    .maybeSingle();

  if (updateErr) throw updateErr;

  if (!updated) {
    const fresh = await getWallet(email);
    if (fresh.credits < amount) {
      return { ok: false, reason: 'insufficient_credits', credits: fresh.credits };
    }
    const { data: retry, error: retryErr } = await supabase
      .from('user_wallet')
      .update({
        credits_balance: fresh.credits - amount,
        updated_at: now,
      })
      .eq('user_email', email)
      .gte('credits_balance', amount)
      .select('credits_balance')
      .maybeSingle();
    if (retryErr) throw retryErr;
    if (!retry) {
      return { ok: false, reason: 'insufficient_credits', credits: fresh.credits };
    }
    await supabase.from('credit_ledger').insert({
      user_email: email,
      delta: -amount,
      reason: meta.reason,
      reference_type: meta.referenceType,
      reference_id: meta.referenceId,
      idempotency_key: meta.idempotencyKey || null,
    });
    return { ok: true, credits: retry.credits_balance };
  }

  const { error: ledgerErr } = await supabase.from('credit_ledger').insert({
    user_email: email,
    delta: -amount,
    reason: meta.reason,
    reference_type: meta.referenceType,
    reference_id: meta.referenceId,
    idempotency_key: meta.idempotencyKey || null,
  });

  if (ledgerErr) {
    console.error('credit_ledger insert failed, rolling back balance', ledgerErr);
    await supabase
      .from('user_wallet')
      .update({
        credits_balance: wallet.credits,
        updated_at: now,
      })
      .eq('user_email', email);
    throw ledgerErr;
  }

  return { ok: true, credits: updated.credits_balance };
}

export async function consumeCredits(userEmail, type, options = {}) {
  const email = normalizeEmail(userEmail);
  if (!email) {
    return { allowed: false, reason: 'not_authenticated' };
  }

  if (await hasUnlimitedAccess(email)) {
    const sub = await getActiveSubscription(email);
    return {
      allowed: true,
      unlimited: true,
      subscription: sub,
      credits: null,
    };
  }

  const cost = CREDIT_COST[type];
  if (!cost) {
    return { allowed: false, reason: 'invalid_type' };
  }

  const idempotencyKey =
    options.idempotencyKey ||
    (options.referenceId ? `${type}:${email}:${options.referenceId}` : null);

  const result = await deductCredits(email, cost, {
    reason: `consume_${type}`,
    referenceType: type,
    referenceId: options.referenceId || null,
    idempotencyKey,
  });

  if (!result.ok) {
    return {
      allowed: false,
      reason: result.reason,
      credits: result.credits,
      cost,
    };
  }

  return {
    allowed: true,
    unlimited: false,
    credits: result.credits,
    cost,
    duplicate: result.duplicate,
  };
}

export async function activateSubscription(userEmail, planId, paymentMeta = {}) {
  const email = normalizeEmail(userEmail);
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!email || !plan) throw new Error('Invalid plan or email');

  const supabase = db();
  const now = new Date();

  // If the user buys again while still active, extend from the current expiry.
  let base = now;
  try {
    const { data: active } = await supabase
      .from('user_subscriptions')
      .select('expires_at')
      .eq('user_email', email)
      .eq('status', 'active')
      .gt('expires_at', now.toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (active?.expires_at) {
      const activeExpiry = new Date(active.expires_at);
      if (!Number.isNaN(activeExpiry.getTime()) && activeExpiry > base) {
        base = activeExpiry;
      }
    }
  } catch (_) {
    // ignore — fallback to now
  }

  const startsAt = now;
  const expiresAt = new Date(base);
  if (plan.durationHours) {
    expiresAt.setTime(expiresAt.getTime() + plan.durationHours * 60 * 60 * 1000);
  } else {
    expiresAt.setDate(expiresAt.getDate() + (plan.durationDays || 0));
  }

  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_email: email,
      plan_id: planId,
      status: 'active',
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      razorpay_order_id: paymentMeta.razorpayOrderId || null,
      razorpay_payment_id: paymentMeta.razorpayPaymentId || null,
      amount_paise: paymentMeta.amountPaise ?? plan.priceInr * 100,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getWalletSummary(userEmail) {
  const email = normalizeEmail(userEmail);
  const [wallet, subscription] = await Promise.all([
    getWallet(email),
    getActiveSubscription(email),
  ]);

  return {
    email,
    credits: wallet.credits,
    signupBonusGranted: wallet.signupBonusGranted,
    unlimited: Boolean(subscription),
    subscription: subscription
      ? {
          planId: subscription.plan_id,
          planName: SUBSCRIPTION_PLANS[subscription.plan_id]?.name || subscription.plan_id,
          expiresAt: subscription.expires_at,
        }
      : null,
    costs: CREDIT_COST,
    signupBonus: SIGNUP_BONUS_CREDITS,
    plans: SUBSCRIPTION_PLANS,
  };
}
