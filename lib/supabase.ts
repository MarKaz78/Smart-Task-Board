
import { createClient } from '@supabase/supabase-js';

// Bezpieczny dostęp do zmiennych środowiskowych
const getEnv = (key: string, fallback: string = ''): string => {
  try {
    return (typeof process !== 'undefined' && process.env && process.env[key]) || fallback;
  } catch (e) {
    return fallback;
  }
};

const supabaseUrl = getEnv('SUPABASE_URL', 'https://pihkjexqujborgqcrqly.supabase.co');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpaGtqZXhxdWpib3JncWNycWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODA2MTMsImV4cCI6MjA3NDY1NjYxM30.lz5D8wV-wJYU1Qy8qV6LsHZzJU3UaUtfu6k3Vp6a_VA');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
