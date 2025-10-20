"use client";

import { supabaseClient } from "@/db/supabase.client";
import { useEffect } from "react";

export const SupabaseAuthListener = () => {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        // We need to reload to make sure the server-side picks up the session
        window.location.reload();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
};

export default SupabaseAuthListener;
