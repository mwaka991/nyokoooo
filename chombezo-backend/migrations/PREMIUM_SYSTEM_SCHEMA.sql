/**
 * PREMIUM PAYMENT SYSTEM - DATABASE SCHEMA
 * 
 * This file documents the database tables required for the premium payment system.
 * Tables: payments, access_sessions
 * 
 * Execute these migrations in Supabase to set up the system.
 */

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================
-- Stores all payment transactions from users

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL DEFAULT 'fastlipa',
  provider_reference VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(20) NOT NULL,
  amount_tsh INTEGER NOT NULL CHECK (amount_tsh = 1000), -- Always 1000 TSH
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid, failed, expired
  verified_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE, -- Payment expires if not completed
  metadata JSONB, -- FastLipa response, error details, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_payments_phone_number ON payments(phone_number);
CREATE INDEX idx_payments_provider_reference ON payments(provider_reference);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- ============================================================================
-- ACCESS_SESSIONS TABLE
-- ============================================================================
-- Tracks premium video access with 1-hour expiry

CREATE TABLE IF NOT EXISTS access_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  user_identifier VARCHAR(255), -- Phone number or device identifier
  session_token VARCHAR(255) NOT NULL UNIQUE,
  access_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  access_expiry_time TIMESTAMP WITH TIME ZONE NOT NULL, -- Start time + 1 hour
  expires_at TIMESTAMP WITH TIME ZONE, -- Alias for compatibility
  active BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  last_accessed TIMESTAMP WITH TIME ZONE,
  accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups and auto-expiry
CREATE INDEX idx_access_sessions_token ON access_sessions(session_token);
CREATE INDEX idx_access_sessions_phone ON access_sessions(phone_number);
CREATE INDEX idx_access_sessions_active ON access_sessions(active) WHERE active = true;
CREATE INDEX idx_access_sessions_expiry ON access_sessions(access_expiry_time DESC);
CREATE INDEX idx_access_sessions_payment_id ON access_sessions(payment_id);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================================================================

-- Auto-update updated_at on payments table
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payments_updated_at ON payments;
CREATE TRIGGER trigger_update_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_payments_updated_at();

-- Auto-update updated_at on access_sessions table
CREATE OR REPLACE FUNCTION update_access_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_access_sessions_updated_at ON access_sessions;
CREATE TRIGGER trigger_update_access_sessions_updated_at
BEFORE UPDATE ON access_sessions
FOR EACH ROW
EXECUTE FUNCTION update_access_sessions_updated_at();

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- View: Active premium sessions count
CREATE OR REPLACE VIEW v_active_premium_sessions AS
SELECT 
  COUNT(*) as active_sessions,
  COUNT(DISTINCT phone_number) as unique_users,
  NOW() as snapshot_time
FROM access_sessions
WHERE active = true AND access_expiry_time > NOW();

-- View: Daily revenue
CREATE OR REPLACE VIEW v_daily_revenue AS
SELECT 
  DATE(created_at) as pay_date,
  COUNT(*) as transaction_count,
  SUM(CASE WHEN status = 'paid' THEN amount_tsh ELSE 0 END) as revenue_tsh,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count
FROM payments
GROUP BY DATE(created_at)
ORDER BY pay_date DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE payments IS 'Stores all FastLipa payment transactions for premium access';
COMMENT ON TABLE access_sessions IS 'Tracks 1-hour premium video access sessions';
COMMENT ON COLUMN payments.amount_tsh IS 'Fixed amount: 1000 TSH for premium access';
COMMENT ON COLUMN access_sessions.access_expiry_time IS '1-hour expiry from access_start_time';
COMMENT ON COLUMN access_sessions.session_token IS 'Secure token for access verification';
