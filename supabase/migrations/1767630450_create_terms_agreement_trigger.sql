-- Migration: create_terms_agreement_trigger
-- Created at: 1767630450

-- Create function to handle terms agreement on user signup
CREATE OR REPLACE FUNCTION handle_new_user_terms_agreement()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile with terms agreement information
  UPDATE profiles 
  SET 
    agreed_to_terms = COALESCE(NEW.raw_user_meta_data->>'agreed_to_terms', 'false')::boolean,
    agreed_to_terms_at = CASE 
      WHEN NEW.raw_user_meta_data->>'agreed_to_terms' = 'true' 
      THEN COALESCE(NEW.raw_user_meta_data->>'agreed_to_terms_at', NOW())::timestamptz 
      ELSE NULL 
    END,
    terms_version = COALESCE(NEW.raw_user_meta_data->>'terms_version', '1.0'),
    privacy_policy_version = COALESCE(NEW.raw_user_meta_data->>'privacy_policy_version', '1.0'),
    role = 'user',
    is_active = true,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run after user creation
DROP TRIGGER IF EXISTS on_auth_user_created_terms ON auth.users;
CREATE TRIGGER on_auth_user_created_terms
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_terms_agreement();;