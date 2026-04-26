import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user ?? null;

  let profile: unknown = null;
  let profileError: unknown = null;

  if (user?.id) {
    const res = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    profile = res.data ?? null;
    profileError = res.error ?? null;
  }

  return NextResponse.json({
    ok: true,
    auth: {
      hasUser: Boolean(user),
      userId: user?.id ?? null,
      emailConfirmedAt: (user as any)?.email_confirmed_at ?? null,
      userError: userError ? { message: userError.message, status: (userError as any).status } : null,
    },
    profiles: {
      hasProfile: Boolean(profile),
      profile,
      profileError: profileError ? { message: (profileError as any).message, code: (profileError as any).code } : null,
    },
  });
}

