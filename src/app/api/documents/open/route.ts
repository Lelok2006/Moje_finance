import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Manjka ID dokumenta." }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Gospodinjstvo ni najdeno." }, { status: 403 });
  }

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("file_path,household_id")
    .eq("id", id)
    .eq("household_id", profile.household_id)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "Dokument ni najden." }, { status: 404 });
  }

  if (!doc.file_path) {
    return NextResponse.json({ error: "Datoteka za dokument ni shranjena." }, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.file_path, 600);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Dokumenta ni mogoče odpreti." }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
