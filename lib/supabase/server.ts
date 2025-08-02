import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export const createServerClient = () => {
  // Check if environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl.includes('placeholder') || 
      supabaseAnonKey.includes('placeholder') ||
      supabaseUrl === 'your_supabase_project_url_here' ||
      supabaseAnonKey === 'your_supabase_anon_key_here') {
    console.warn('Supabase environment variables not properly configured');
    // Return a mock client to prevent crashes during development
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null })
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
      }),
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
          download: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
          remove: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
        })
      }
    } as any;
  }
  
  try {
    const cookieStore = cookies();
    return createServerComponentClient<Database>({ cookies: () => cookieStore });
  } catch (error) {
    console.warn('Failed to create server client:', error);
    // Return mock client if cookies are not available
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null })
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Server context not available' } }) }) }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Server context not available' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Server context not available' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Server context not available' } })
      }),
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: { message: 'Server context not available' } }),
          download: () => Promise.resolve({ data: null, error: { message: 'Server context not available' } }),
          remove: () => Promise.resolve({ data: null, error: { message: 'Server context not available' } })
        })
      }
    } as any;
  }
};