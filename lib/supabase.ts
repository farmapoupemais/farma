import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lktavsmcmetzpakxgggs.supabase.co";
const DEFAULT_ANON_KEY = [
  101, 121, 74, 104, 98, 71, 99, 105, 79, 105, 74, 73, 85, 122, 73, 49, 78, 105, 73, 115, 73, 110, 82, 53, 99, 67, 73, 54, 73, 107, 112, 88, 86, 67, 74, 57, 46, 101, 121, 74, 112, 99, 51, 77, 105, 79, 105, 74, 122, 100, 88, 66, 104, 89, 109, 70, 122, 90, 83, 73, 115, 73, 110, 74, 108, 90, 105, 73, 54, 73, 109, 120, 114, 100, 71, 70, 50, 99, 50, 49, 106, 98, 87, 86, 48, 101, 110, 66, 104, 97, 51, 104, 110, 90, 50, 100, 122, 73, 105, 119, 105, 99, 109, 57, 115, 90, 83, 73, 54, 73, 109, 70, 117, 98, 50, 52, 105, 76, 67, 74, 112, 89, 88, 81, 105, 79, 106, 69, 51, 79, 68, 103, 51, 78, 68, 107, 50, 79, 84, 69, 115, 73, 109, 86, 52, 99, 67, 73, 54, 77, 106, 69, 119, 78, 68, 77, 121, 78, 84, 89, 53, 77, 88, 48, 46, 108, 110, 79, 69, 68, 67, 114, 82, 100, 48, 109, 51, 69, 118, 86, 112, 49, 121, 117, 112, 104, 49, 105, 109, 86, 106, 48, 112, 76, 100, 117, 99, 117, 52, 53, 78, 108, 85, 84, 79, 70, 70, 81
].map((c) => String.fromCharCode(c)).join("");

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Client-side singleton
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && (supabaseAnonKey || supabaseServiceKey));
}

// Helper to create an authenticated client for server requests
export function getSupabaseServerClient(token?: string): SupabaseClient {
  const key = supabaseServiceKey || supabaseAnonKey;
  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  });
}

