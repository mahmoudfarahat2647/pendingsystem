-- Fix corrupted order data where string fields are stored as arrays
-- This migration fixes the data corruption issue causing the "Create New Order" button to fail

-- Function to fix corrupted metadata fields
CREATE OR REPLACE FUNCTION fix_corrupted_order_metadata()
RETURNS void AS $$
DECLARE
    order_record RECORD;
    fixed_metadata jsonb;
BEGIN
    -- Loop through all orders to fix corrupted metadata
    FOR order_record IN SELECT id, metadata FROM orders WHERE metadata IS NOT NULL
    LOOP
        fixed_metadata := order_record.metadata;
        
        -- Fix customerName field (convert array to string)
        IF fixed_metadata->>'customerName' IS NOT NULL THEN
            BEGIN
                DECLARE
                    customer_name_val jsonb := fixed_metadata->'customerName';
                    customer_name_text text;
                BEGIN
                    IF customer_name_val = '[]'::jsonb THEN
                        customer_name_text := '';
                    ELSIF jsonb_typeof(customer_name_val) = 'array' THEN
                        customer_name_text := (customer_name_val->>0)::text;
                    ELSE
                        customer_name_text := customer_name_val::text;
                    END IF;
                    
                    fixed_metadata := jsonb_set(fixed_metadata, '{customerName}', to_jsonb(customer_name_text));
                EXCEPTION
                    WHEN OTHERS THEN
                        -- If conversion fails, set to empty string
                        fixed_metadata := jsonb_set(fixed_metadata, '{customerName}', to_jsonb(''));
                END;
            END;
        END IF;
        
        -- Fix mobile field (convert array to string)
        IF fixed_metadata->>'mobile' IS NOT NULL THEN
            BEGIN
                DECLARE
                    mobile_val jsonb := fixed_metadata->'mobile';
                    mobile_text text;
                BEGIN
                    IF mobile_val = '[]'::jsonb THEN
                        mobile_text := '';
                    ELSIF jsonb_typeof(mobile_val) = 'array' THEN
                        mobile_text := (mobile_val->>0)::text;
                    ELSE
                        mobile_text := mobile_val::text;
                    END IF;
                    
                    fixed_metadata := jsonb_set(fixed_metadata, '{mobile}', to_jsonb(mobile_text));
                EXCEPTION
                    WHEN OTHERS THEN
                        -- If conversion fails, set to empty string
                        fixed_metadata := jsonb_set(fixed_metadata, '{mobile}', to_jsonb(''));
                END;
            END;
        END IF;
        
        -- Fix model field (convert array to string)
        IF fixed_metadata->>'model' IS NOT NULL THEN
            BEGIN
                DECLARE
                    model_val jsonb := fixed_metadata->'model';
                    model_text text;
                BEGIN
                    IF model_val = '[]'::jsonb THEN
                        model_text := '';
                    ELSIF jsonb_typeof(model_val) = 'array' THEN
                        model_text := (model_val->>0)::text;
                    ELSE
                        model_text := model_val::text;
                    END IF;
                    
                    fixed_metadata := jsonb_set(fixed_metadata, '{model}', to_jsonb(model_text));
                EXCEPTION
                    WHEN OTHERS THEN
                        -- If conversion fails, set to empty string
                        fixed_metadata := jsonb_set(fixed_metadata, '{model}', to_jsonb(''));
                END;
            END;
        END IF;
        
        -- Update the order with fixed metadata
        UPDATE orders 
        SET metadata = fixed_metadata 
        WHERE id = order_record.id;
        
        -- Log the fix
        INSERT INTO recent_activity (action_name, timestamp)
        VALUES (CONCAT('Fixed corrupted metadata for order ', order_record.id), NOW());
        
    END LOOP;
    
    RAISE NOTICE 'Fixed metadata for all orders';
END;
$$ LANGUAGE plpgsql;

-- Execute the function to fix corrupted data
SELECT fix_corrupted_order_metadata();

-- Create a function to validate that all orders now have proper string fields
CREATE OR REPLACE FUNCTION validate_order_data_integrity()
RETURNS TABLE(order_id uuid, issue_type text, field_name text, current_value text) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        'Array field detected' as issue_type,
        'customerName' as field_name,
        o.metadata->>'customerName' as current_value
    FROM orders o
    WHERE o.metadata IS NOT NULL 
      AND o.metadata->>'customerName' IS NOT NULL
      AND jsonb_typeof(o.metadata->'customerName') = 'array'
    
    UNION ALL
    
    SELECT 
        o.id,
        'Array field detected' as issue_type,
        'mobile' as field_name,
        o.metadata->>'mobile' as current_value
    FROM orders o
    WHERE o.metadata IS NOT NULL 
      AND o.metadata->>'mobile' IS NOT NULL
      AND jsonb_typeof(o.metadata->'mobile') = 'array'
    
    UNION ALL
    
    SELECT 
        o.id,
        'Array field detected' as issue_type,
        'model' as field_name,
        o.metadata->>'model' as current_value
    FROM orders o
    WHERE o.metadata IS NOT NULL 
      AND o.metadata->>'model' IS NOT NULL
      AND jsonb_typeof(o.metadata->'model') = 'array';
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Run validation to check if any issues remain
SELECT * FROM validate_order_data_integrity();

-- Log completion of migration
INSERT INTO recent_activity (action_name, timestamp)
VALUES ('Completed order data corruption fix migration', NOW());

-- Drop the helper functions after use
DROP FUNCTION IF EXISTS fix_corrupted_order_metadata();
DROP FUNCTION IF EXISTS validate_order_data_integrity();