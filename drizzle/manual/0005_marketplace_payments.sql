-- 0005: Razorpay online payments for marketplace orders.
-- Idempotent: safe to run multiple times.
CREATE TABLE IF NOT EXISTS marketplace_payments (
  id text PRIMARY KEY,
  razorpay_order_id text NOT NULL UNIQUE,
  razorpay_payment_id text,
  student_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  order_ids jsonb NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'CREATED',
  failure_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS marketplace_payments_student_idx ON marketplace_payments (student_id);
