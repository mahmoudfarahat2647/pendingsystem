-- Fix foreign key constraint violation on delete
-- Error: "Operation failed: insert or update on table "activity_log" violates foreign key constraint "activity_log_order_id_fkey""
-- 
-- Root cause: The activity_log table has a foreign key referencing orders(id) 
-- without ON DELETE CASCADE, preventing order deletion when activity_log records exist
--
-- Solution: Drop the restrictive constraint and add it back with CASCADE DELETE

-- Step 1: Drop the problematic foreign key constraint if it exists
DO $$
DECLARE
    constraint_exists boolean;
BEGIN
    -- Check if the constraint exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND constraint_name = 'activity_log_order_id_fkey'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        -- Find which table has this constraint and drop it
        FOR r IN (
            SELECT table_name
            FROM information_schema.table_constraints 
            WHERE table_schema = 'public' 
            AND constraint_name = 'activity_log_order_id_fkey'
        ) LOOP
            EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT activity_log_order_id_fkey', r.table_name);
        END LOOP;
    END IF;
END $$;

-- Step 2: Ensure activity_log table exists and add CASCADE DELETE constraint
DO $$
BEGIN
    -- Check if activity_log exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'activity_log'
    ) THEN
        -- Check if order_id column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'activity_log' 
            AND column_name = 'order_id'
        ) THEN
            -- Add the constraint with CASCADE DELETE
            ALTER TABLE public.activity_log 
            ADD CONSTRAINT activity_log_order_id_fkey 
            FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
            
            -- Clean up orphaned records
            DELETE FROM public.activity_log 
            WHERE order_id IS NOT NULL 
            AND order_id NOT IN (SELECT id FROM public.orders);
        END IF;
    END IF;
END $$;

-- Step 3: Do the same for recent_activity if it has order references
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'recent_activity'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'recent_activity' 
            AND column_name = 'order_id'
        ) THEN
            -- Drop old constraint if exists
            IF EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE table_schema = 'public'
                AND table_name = 'recent_activity' 
                AND constraint_name = 'recent_activity_order_id_fkey'
            ) THEN
                ALTER TABLE public.recent_activity DROP CONSTRAINT recent_activity_order_id_fkey;
            END IF;
            
            -- Add constraint with CASCADE DELETE
            ALTER TABLE public.recent_activity 
            ADD CONSTRAINT recent_activity_order_id_fkey 
            FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
            
            -- Clean up orphaned records
            DELETE FROM public.recent_activity 
            WHERE order_id IS NOT NULL 
            AND order_id NOT IN (SELECT id FROM public.orders);
        END IF;
    END IF;
END $$;
