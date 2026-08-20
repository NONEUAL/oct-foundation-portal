import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = "still checking"

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    // Keeps state in sync across tabs, token refreshes, and the moment a
    // magic-link redirect lands back on the site.
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession)
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function sendMagicLink(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/moderator" },
    });
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const value = {
    session,
    user: session?.user ?? null,
    isLoading: session === undefined,
    sendMagicLink,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
