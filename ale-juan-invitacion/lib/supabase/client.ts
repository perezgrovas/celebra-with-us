import { createClient, type SupabaseClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const isConfigured = Boolean(url && key);
let browser: SupabaseClient | undefined;
export function getBrowserClient() {
  if (!url || !key)
    throw new Error(
      "Falta configurar la conexión con Supabase. Revisa README.md.",
    );
  return (browser ??= createClient(url, key));
}
export function getPublicClient() {
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
