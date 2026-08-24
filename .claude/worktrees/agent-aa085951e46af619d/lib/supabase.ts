import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Stores the session in cookies (not localStorage) so middleware.ts can read
// it on the server before any page code runs.
export const supabase = createBrowserClient(url, key);
