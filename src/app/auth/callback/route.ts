import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const inviteToken = searchParams.get("invite");

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Preveri ali user že ima gospodinjstvo; če ne, ga ustvari avtomatsko
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from("user_profiles")
        .select("household_id")
        .maybeSingle();

      if (!profile?.household_id) {
        const { data: { user } } = await supabase.auth.getUser();
        const prefix = user?.email?.split("@")[0] ?? "gospodinjstvo";
        const name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).rpc("setup_household", {
          p_household_name: name,
          p_member_name: "Skrbnik",
        });
      }

      if (inviteToken) {
        return NextResponse.redirect(`${origin}/invite/${inviteToken}`);
      }

      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Potrditev+ni+uspela.`);
}
