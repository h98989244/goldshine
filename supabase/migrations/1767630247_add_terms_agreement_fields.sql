-- Migration: add_terms_agreement_fields
-- Created at: 1767630247

-- Add terms and privacy policy agreement fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS agreed_to_terms BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS agreed_to_terms_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms_version VARCHAR(50) DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS privacy_policy_version VARCHAR(50) DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;;