import { createClient } from '@supabase/supabase-js'

// Load env vars for local dev from .env.local, and from .env in production
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env' : '.env.local',
})

const SUPABASE_URL = process.env.SEORO_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SEORO_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error('SEORO_PUBLIC_SUPABASE_URL and SEORO_SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env.local (or .env in production)')
}

export const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)
