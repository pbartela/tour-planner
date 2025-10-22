import { supabaseClient as supabaseBrowserClient } from "@/db/supabase.client";
import { useEffect, useState } from "react";

interface AuthStatus {
  isLoading: boolean;
  isLoggedIn: boolean;
  email?: string;
  username?: string;
}

export const DebugAuthStatus = () => {
  const [status, setStatus] = useState<AuthStatus>({
    isLoading: true,
    isLoggedIn: false,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabaseBrowserClient.auth.getSession();

      if (session?.user.email) {
        setStatus({
          isLoading: false,
          isLoggedIn: true,
          email: session.user.email,
        });
      } else {
        setStatus({
          isLoading: false,
          isLoggedIn: false,
        });
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    await supabaseBrowserClient.auth.signOut();
    window.location.reload();
  };

  if (status.isLoading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="fixed bottom-4 right-4 p-3 bg-gray-900 text-white rounded shadow-lg text-sm max-w-xs">
      <div className="font-bold mb-2">Debug: Auth Status</div>
      <div className="mb-2">
        Status:{" "}
        <span className={status.isLoggedIn ? "text-green-400" : "text-red-400"}>
          {status.isLoggedIn ? "✓ Logged In" : "✗ Not Logged In"}
        </span>
      </div>
      {status.isLoggedIn && (
        <>
          <div className="mb-2 break-all">Email: {status.email}</div>
          <button
            onClick={handleLogout}
            className="w-full px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-medium"
          >
            Logout
          </button>
        </>
      )}
    </div>
  );
};
