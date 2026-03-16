-- Create a function to handle commission creation upon order completion
CREATE OR REPLACE FUNCTION public.handle_new_commission()
RETURNS TRIGGER AS $$
DECLARE
    referrer_id UUID;
    comm_rate NUMERIC;
    comm_amount NUMERIC;
    existing_comm_id INTEGER;
BEGIN
    -- Check if status changed to completed
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
        
        -- Find referrer
        SELECT referred_by INTO referrer_id
        FROM public.profiles
        WHERE id = NEW.user_id;

        -- If user was referred
        IF referrer_id IS NOT NULL THEN
            
            -- Get referrer's commission rate from their profile
            SELECT commission_rate INTO comm_rate
            FROM public.profiles
            WHERE id = referrer_id;

            -- Default rate if null (e.g. 0.05 for 5%)
            IF comm_rate IS NULL THEN
                comm_rate := 0.05;
            END IF;

            -- Calculate amount
            comm_amount := NEW.total * comm_rate;

            -- Check if commission already exists for this order (prevent duplicates)
            SELECT id INTO existing_comm_id
            FROM public.commissions
            WHERE order_id = NEW.id;

            IF existing_comm_id IS NULL THEN
                INSERT INTO public.commissions (
                    agent_id,
                    order_id,
                    amount,
                    rate,
                    status,
                    settlement_month,
                    created_at
                ) VALUES (
                    referrer_id,
                    NEW.id,
                    comm_amount,
                    comm_rate,
                    'pending',
                    to_char(COALESCE(NEW.verified_at, now()), 'YYYY-MM'),
                    now()
                );
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_order_completed_commission ON public.orders;

CREATE TRIGGER on_order_completed_commission
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_commission();
