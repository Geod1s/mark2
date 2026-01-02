// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If environment variables are not set, return a properly structured mock client
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables are not set. Please check your .env.local file.");

    // Return a mock client object for development purposes
    if (process.env.NODE_ENV === 'development') {
      console.warn("Running in development mode with mock Supabase client.");
      
      // Create a properly structured mock client
      const mockClient = {
        auth: {  
        getUser: async () => { 
            return { 
              data: { user: null }, 
              error: { message: "Supabase not configured. Please set environment variables." } 
            }; 
          },
          signOut: async () => ({ error: null }),
          signInWithPassword: async () => ({ 
            data: { user: null, session: null }, 
            error: { message: "Supabase not configured. Please set environment variables." } 
          }),
          signUp: async () => ({ 
            data: { user: null, session: null }, 
            error: { message: "Supabase not configured" } 
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ 
                data: null, 
                error: { message: "Supabase not configured" } 
              }),
              single: async () => ({ 
                data: null, 
                error: { message: "Supabase not configured" } 
              })
            }),
            neq: () => ({
              order: () => ({
                limit: async () => ({ 
                  data: null, 
                  error: { message: "Supabase not configured" } 
                })
              })
            }),
            order: () => ({
              limit: async () => ({ 
                data: null, 
                error: { message: "Supabase not configured" } 
              })
            })
          }),
          insert: async () => ({ 
            data: null, 
            error: { message: "Supabase not configured" } 
          }),
          update: async () => ({ 
            data: null, 
            error: { message: "Supabase not configured" } 
          }),
          delete: async () => ({ 
            data: null, 
            error: { message: "Supabase not configured" } 
          }),
        }),
      };
      
      return mockClient as any;
    } else {
      throw new Error("Missing Supabase environment variables");
    }
  }

  // Use next/headers cookies() to read cookies in server components.
  // Note: modifying cookies via `cookies().set()` is only allowed inside
  // Route Handlers or Server Actions. When this helper runs in a plain
  // Server Component we must avoid trying to set cookies (middleware/edge
  // handlers handle setting cookies elsewhere).
  // `cookies()` returns a Promise in some Next versions/environments, so
  // await it here to get the resolved cookie store before use.
  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          try {
            return cookieStore.getAll();
          } catch {
            return [];
          }
        },
        setAll(cookiesToSet) {
          // Attempt to set cookies only when supported. `cookieStore.set` may
          // throw when called outside a Route Handler / Server Action, so
          // catch and noop in that case.
          if (typeof (cookieStore as any).set !== 'function') {
            // Not allowed to set cookies here — skip and warn.
            console.warn('Supabase requested to set cookies, but cookie modifications are not allowed in this context. Skipping.');
            return;
          }

          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                // `cookieStore.set` accepts either (name, value) or an object
                // depending on runtime. Use object form when possible.
                const maybeOptions = options || {};
                // Some Next versions expect `cookieStore.set({ name, value, ...opts })`
                // while others accept `set(name, value)`. Try object first.
                try {
                  (cookieStore as any).set({ name, value, ...maybeOptions });
                } catch (e) {
                  // Fallback to older signature
                  (cookieStore as any).set(name, value);
                }
              } catch (err) {
                // Individual cookie failed to set; continue with others
                console.warn('Failed to set cookie', name, err);
              }
            });
          } catch (error) {
            console.error('Error setting cookies:', error);
          }
        },
      },
    }
  );
};