
import { createClient } from '@supabase/supabase-js';

// Assuming variables are provided via process.env
const supabaseUrl = process.env.SUPABASE_URL || 'https://pihkjexqujborgqcrqly.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpaGtqZXhxdWpib3JncWNycWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODA2MTMsImV4cCI6MjA3NDY1NjYxM30.lz5D8wV-wJYU1Qy8qV6LsHZzJU3UaUtfu6k3Vp6a_VA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
