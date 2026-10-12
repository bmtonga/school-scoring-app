-- Insert test users with roles in app_metadata
-- These users will be used to verify RLS and authorization behavior

-- Principal user
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'principal@school.local',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role": "principal"}'::jsonb,
  '{"role": "principal"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- Numeracy program user
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'numeracy@school.local',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role": "numeracy"}'::jsonb,
  '{"role": "numeracy"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- Literacy program user
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'literacy@school.local',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role": "literacy"}'::jsonb,
  '{"role": "literacy"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- Just-a-minute program user
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'jam@school.local',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role": "just_a_minute"}'::jsonb,
  '{"role": "just_a_minute"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- User with invalid role (for negative testing)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'invalid@school.local',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role": "invalid_role"}'::jsonb,
  '{"role": "invalid_role"}'::jsonb
) ON CONFLICT (email) DO NOTHING;
