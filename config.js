// config.js
import { createClient } from '@supabase/supabase-js'

// Supabase Project URL और anon/public key डालो
const supabaseUrl = "https://xnuondpfihckkqzyntjv.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."  // तुमारी anon/public key
export const supabase = createClient(supabaseUrl, supabaseKey)
