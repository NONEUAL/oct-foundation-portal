import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase, getActiveEdition } from "./supabaseClient";

const AuthContext = createContext(null);

const NO_ROLE = { isAdmin: false, moderatorDepartments: [], canDeclareWinners: false, loaded: false };

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [role, setRole] = useState(NO_ROLE);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) =>
      setSession(next)
    );
    return () => subscription.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;

  const loadRole = useCallback(async () => {
    if (!userId) {
      setRole({ ...NO_ROLE, loaded: true });
      return;
    }
    // An admin-created invite for this email becomes a moderator row here.
    await supabase.rpc("claim_moderator_invite");
    const edition = await getActiveEdition();
    const [adminRes, modRes] = await Promise.all([
      supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle(),
      edition
        ? supabase
            .from("moderators")
            .select("can_declare_winners, departments(id, code, name)")
            .eq("user_id", userId)
            .eq("edition_id", edition.id)
        : Promise.resolve({ data: [] }),
    ]);
    const rows = modRes.data || [];
    setRole({
      isAdmin: !!adminRes.data,
      moderatorDepartments: rows.map((r) => r.departments).filter(Boolean),
      canDeclareWinners: rows.some((r) => r.can_declare_winners),
      loaded: true,
    });
  }, [userId]);

  useEffect(() => {
    if (session === undefined) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRole();
  }, [session, loadRole]);

  async function sendMagicLink(email, redirectPath = "/moderator") {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + redirectPath },
    });
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const value = {
    session,
    user: session?.user ?? null,
    isLoading: session === undefined || (!!session && !role.loaded),
    ...role,
    reloadRole: loadRole,
    sendMagicLink,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}
