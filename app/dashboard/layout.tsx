import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  
  let user = null;
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;
    console.log('User in dashboard layout:', user); // Add this line for debugging
  } catch (error) {
    console.warn('Failed to get user in dashboard layout:', error);
  }
  
  if (!user) {
    console.log('No user found, redirecting to login.'); // Add this line for debugging
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-5"></div>
      <DashboardNav />
      <main className="relative">
        {children}
      </main>
    </div>
  );
}
