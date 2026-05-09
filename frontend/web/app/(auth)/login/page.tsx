"use client"

import { useState } from "react";
import { AuthComponent } from "@/components/ui/sign-up";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTaxStore } from "@/lib/stores/tax-store";
import { useTrackerStore } from "@/lib/stores/tracker-store";

// A simple placeholder logo for demonstration
const CustomLogo = () => (
  <div className="bg-emerald-500 text-white rounded-md p-1.5">
    <svg 
      className="h-4 w-4" 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  </div>
);

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const handleSuccess = () => {
    console.log('Resetting local stores and redirecting...');
    useTaxStore.getState().reset()
    useTrackerStore.getState().reset()
    router.push('/dashboard');
    // Fallback if router fails
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign in error:', error.message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (email: string, password?: string, mode?: 'login' | 'signup') => {
    setIsEmailLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password: password || '',
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            // User intended to sign up but already exists - try signing in instead
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password: password || '',
            });
            if (signInError) return { error: signInError.message };
            return {}; 
          }
          return { error: error.message };
        }
        return {};
      } else {
        // Login mode
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: password || '',
        });
        if (error) return { error: error.message };
        return {};
      }
    } catch (err: any) {
      return { error: err.message };
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <AuthComponent 
      logo={<CustomLogo />} 
      brandName="Money OS" 
      onSuccess={handleSuccess}
      onGoogleClick={handleGoogleSignIn}
      onEmailSubmit={handleEmailSubmit}
      isGoogleLoading={isGoogleLoading}
      isEmailLoading={isEmailLoading}
    />
  );
}
