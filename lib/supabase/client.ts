// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If environment variables are not set, return a mock client for development
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables are not set. Please check your .env.local file.");

    // Return a mock client object for development purposes
    if (process.env.NODE_ENV === 'development') {
      console.warn("Running in development mode with mock Supabase client.");
      return {
        auth: {
          signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: "Supabase not configured. Please set environment variables." } }),
          signUp: async () => ({ data: { user: null, session: null }, error: { message: "Supabase not configured. Please set environment variables." } }),
          signOut: async () => ({ error: null }),
          getUser: async () => ({ data: { user: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null })
        },
        from: () => ({
          select: async () => ({ data: null, error: { message: "Supabase not configured. Please set environment variables." } }),
          insert: async () => ({ data: null, error: { message: "Supabase not configured. Please set environment variables." } }),
          update: async () => ({ data: null, error: { message: "Supabase not configured. Please set environment variables." } }),
          delete: async () => ({ data: null, error: { message: "Supabase not configured. Please set environment variables." } })
        }),
      } as any;
    } else {
      throw new Error("Missing Supabase environment variables");
    }
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
};