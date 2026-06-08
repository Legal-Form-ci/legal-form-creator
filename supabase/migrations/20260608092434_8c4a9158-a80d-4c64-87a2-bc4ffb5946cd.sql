
CREATE OR REPLACE FUNCTION public.credit_referrer_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer uuid;
  v_commission numeric;
  v_is_first boolean;
BEGIN
  IF NEW.status <> 'paid' OR (OLD.status = 'paid') THEN
    RETURN NEW;
  END IF;

  SELECT referred_by INTO v_referrer FROM public.profiles WHERE user_id = NEW.user_id;
  IF v_referrer IS NULL THEN RETURN NEW; END IF;

  SELECT NOT EXISTS (
    SELECT 1 FROM public.invoices
    WHERE user_id = NEW.user_id AND status = 'paid' AND id <> NEW.id
  ) INTO v_is_first;

  IF NOT v_is_first THEN RETURN NEW; END IF;

  v_commission := round(COALESCE(NEW.amount, 0) * 0.10);
  IF v_commission <= 0 THEN RETURN NEW; END IF;

  UPDATE public.profiles
    SET referral_balance = COALESCE(referral_balance,0) + v_commission,
        referral_earnings = COALESCE(referral_earnings,0) + v_commission,
        total_referred = COALESCE(total_referred,0) + 1,
        referral_count = COALESCE(referral_count,0) + 1
    WHERE user_id = v_referrer;

  INSERT INTO public.referral_events (referrer_id, referred_id, event_type, amount, metadata)
  VALUES (v_referrer, NEW.user_id, 'first_payment', v_commission,
          jsonb_build_object('invoice_id', NEW.id, 'invoice_amount', NEW.amount));

  RETURN NEW;
END;
$$;
