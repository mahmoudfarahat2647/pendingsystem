-- Fix: fn_log_order_activity must return OLD for DELETE operations
-- The trigger was returning NEW for all operations, but NEW is NULL during DELETE,
-- causing the delete to fail silently.

CREATE OR REPLACE FUNCTION public.fn_log_order_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.recent_activity (action_name, timestamp)
    VALUES (
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'Created order ' || COALESCE(NEW.order_number, NEW.id::text)
            WHEN TG_OP = 'UPDATE' THEN 'Updated order ' || COALESCE(NEW.order_number, NEW.id::text)
            WHEN TG_OP = 'DELETE' THEN 'Deleted order ' || COALESCE(OLD.order_number, OLD.id::text)
            ELSE TG_OP || ' on order'
        END,
        NOW()
    );
    
    -- Must return OLD for DELETE, NEW for INSERT/UPDATE
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
