import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) throw new Error("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diset");

// Singleton. Anon key aman di client — RLS yang lindungi baris (TECH_SPEC).
export const supabase = createClient(url, anon);
