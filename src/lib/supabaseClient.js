import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Loud in dev, so a missing .env doesn't fail silently into confusing
  // "why is my data empty" bugs later.
  console.warn(
    "Supabase env vars are missing. Copy .env.example to .env and fill in " +
      "your project URL + anon key from the Supabase dashboard."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// The active edition is looked up once and reused everywhere, rather than
// hardcoding a year anywhere in the app. This is what makes next year's
// launch a one-row database update instead of a code change.
export async function getActiveEdition() {
  const { data, error } = await supabase
    .from("editions")
    .select("*")
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("Could not load the active edition:", error.message);
    return null;
  }
  return data;
}
