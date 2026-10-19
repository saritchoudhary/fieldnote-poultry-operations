import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function makeTemporaryPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
  const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || publishableKeys.default;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || secretKeys.default;
  const loginEmailDomain = Deno.env.get("LOGIN_EMAIL_DOMAIN") || "login.fieldnote.invalid";
  const authorization = request.headers.get("Authorization");
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization) {
    return respond({ error: "Function configuration or authorization is missing" }, 500);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return respond({ error: "Sign in again to continue" }, 401);

  const { data: caller, error: callerError } = await userClient
    .from("profiles")
    .select("role, approval_status")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (callerError || caller?.role !== "admin" || caller.approval_status !== "approved") {
    return respond({ error: "Only an approved Admin can create accounts" }, 403);
  }

  let body: { loginId?: unknown; displayName?: unknown; role?: unknown; farmIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return respond({ error: "Invalid JSON request" }, 400);
  }

  const loginId = String(body.loginId || "").trim().toLowerCase();
  const displayName = String(body.displayName || "").trim();
  const role = String(body.role || "").trim();
  const farmIds = Array.isArray(body.farmIds) ? body.farmIds.map(String) : [];
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(loginId)) return respond({ error: "Login ID must be 3-64 letters, numbers, dots, underscores, or hyphens" }, 400);
  if (displayName.length < 2 || displayName.length > 100) return respond({ error: "Enter a name between 2 and 100 characters" }, 400);
  if (!["admin", "boss", "leader", "team"].includes(role)) return respond({ error: "Choose a valid account role" }, 400);
  if (farmIds.some((id) => !/^[0-9a-f-]{36}$/i.test(id))) return respond({ error: "One or more farm assignments are invalid" }, 400);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const temporaryPassword = makeTemporaryPassword();
  const email = `${loginId}@${loginEmailDomain}`;
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (createError || !created.user) return respond({ error: createError?.message || "Could not create Auth account" }, 400);

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: created.user.id,
    login_id: loginId,
    display_name: displayName,
    role,
    approval_status: "pending",
    must_change_password: true,
  });
  if (profileError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return respond({ error: profileError.message }, 400);
  }

  if (farmIds.length) {
    const memberships = farmIds.map((farmId) => ({
      farm_id: farmId,
      user_id: created.user.id,
      assigned_by: userData.user.id,
    }));
    const { error: membershipError } = await adminClient.from("farm_memberships").insert(memberships);
    if (membershipError) {
      await adminClient.auth.admin.deleteUser(created.user.id);
      return respond({ error: membershipError.message }, 400);
    }
  }

  return respond({ loginId, displayName, role, temporaryPassword }, 201);
});