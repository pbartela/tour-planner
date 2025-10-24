import type { SupabaseClient } from "@/db/supabase.client";

class AuthService {
  public async sendMagicLink(supabase: SupabaseClient, email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    return { error };
  }
}

export const authService = new AuthService();
