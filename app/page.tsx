import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = createServerClient();
  
  let user = null;
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;
  } catch (error) {
    console.warn('Failed to get user on home page:', error);
  }
  
  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/auth/login');
  }
}