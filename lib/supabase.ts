import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cookie session (not localStorage) so proxy.ts can refresh it. @supabase/ssr
// sets Max-Age to 400 days, so the refresh token survives a closed browser.
// The auth server, not the cookie, decides when the session actually ends.
export const supabase = createBrowserClient(url, key);
