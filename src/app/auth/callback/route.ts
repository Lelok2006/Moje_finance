import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

// Supabase preusmeri sem po kliku na potrditveni email
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const inviteToken = searchParams.get("invite"); // ohrani invite token skozi flow

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Preveri ali user že ima gospodinjstvo
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from("user_profiles")
        .select("household_id")
        .maybeSingle();

      if (!profile) {
        const setupUrl = inviteToken
          ? `${origin}/setup?invite=${inviteToken}`
          : `${origin}/setup`;
        return NextResponse.redirect(setupUrl);
      }

      if (inviteToken) {
        return NextResponse.redirect(`${origin}/invite/${inviteToken}`);
      }

      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Potrditev+ni+uspela.`);
}
