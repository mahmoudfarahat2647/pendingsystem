-- Migration: Add 'freeze' label to public.order_stage enum
-- Extends the order_stage enum type with the new 'freeze' operational stage.
--
-- Deploy-order constraint: The database must accept 'freeze' before any
-- application instance writes it, because older app instances reject unknown
-- stage values during validation. Readers deploy before writers.

ALTER TYPE public.order_stage ADD VALUE IF NOT EXISTS 'freeze';
