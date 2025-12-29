'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function LogoutPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Redirect to login page after logout
      router.push('/auth/login');
      router.refresh(); // Refresh to update the UI after logout
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Auto-logout when the component mounts
  useEffect(() => {
    const autoLogout = async () => {
      try {
        await supabase.auth.signOut();
        // Redirect to login page after logout
        router.push('/auth/login');
        router.refresh(); // Refresh to update the UI after logout
      } catch (error) {
        console.error('Error logging out:', error);
      }
    };

    // Uncomment the next line if you want auto-logout on page visit
    // autoLogout();
  }, [router, supabase]);

  return (
    <div className="container max-w-md mx-auto p-4 flex items-center justify-center min-h-screen">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <LogOut className="h-5 w-5" />
            Sign Out
          </CardTitle>
          <CardDescription>Are you sure you want to sign out?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button onClick={handleLogout} variant="destructive">
              Sign Out
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                // Go back to previous page or dashboard
                router.back();
              }}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}