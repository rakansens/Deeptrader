import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types";

const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anon } =
  process.env;

export function createServerSupabase() {
  const store = cookies();
  return createServerClient<Database>(url!, anon!, {
    cookies: {
      get:  (n) => store.get(n)?.value,
      set:  (n, v, o) => { try { store.set({ name: n, value: v, ...o }); } catch {} },
      remove:(n,   o) => { try { store.set({ name: n, value: "", ...o }); } catch {} },
    },
  });
} 