import { createBrowserClient } from "@supabase/ssr";

// TODO: po `npx supabase gen types typescript --linked` dodaj: createBrowserClient<Database>
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
