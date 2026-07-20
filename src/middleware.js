import { getToken }           from "next-auth/jwt";
import { NextResponse }        from "next/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";

// ─── Public paths (no auth required) ──────────────────────────────────────
const publicPaths = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/signin",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/api/auth",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/_next/static",
  "/_next/image",
  "/favicon.ico",
  "/terms",
  "/privacy",
];

// ─── Maintenance bypass paths ──────────────────────────────────────────────
const maintenanceBypassPaths = [
  "/maintenance",
  "/auth/login",
  "/auth/signup",
  "/auth/signin",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/api/auth",
  "/_next/static",
  "/_next/image",
  "/favicon.ico",
];

// ─── Role-gated path groups ────────────────────────────────────────────────
const authenticatedPaths = ["/dashboard", "/profile", "/settings"];
const adminPaths         = ["/admin"];
const teacherPaths       = ["/teacher"];
const studentPaths       = ["/tests", "/practice", "/courses"];

// ─── Paths that SKIP rate limiting (Vercel cron, static assets) ───────────
const rateLimitSkipPaths = [
  "/_next/static",
  "/_next/image",
  "/favicon.ico",
  "/api/cron/",   // protected separately by CRON_SECRET
];

// ─── Upstash maintenance-mode check (edge-safe) ───────────────────────────
async function isMaintenanceModeActive() {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  try {
    const res = await fetch(`${url}/get/settings:maintenance_mode`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const json = await res.json();
    return json.result === "1";
  } catch {
    return false;
  }
}

// ─── Security headers applied to every response ───────────────────────────
function buildSecurityHeaders() {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  return {
    "X-Content-Type-Options":  "nosniff",
    "X-Frame-Options":         "DENY",
    "X-XSS-Protection":        "1; mode=block",
    "Referrer-Policy":         "strict-origin-when-cross-origin",
    "Permissions-Policy":      "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Content-Security-Policy":
      `default-src 'self'; ` +
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com 'nonce-${nonce}'; ` +
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ` +
      `img-src 'self' data: https:; ` +
      `font-src 'self' https://fonts.gstatic.com; ` +
      `connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com wss:; ` +
      `frame-src 'self' https://www.youtube.com https://www.google.com;`,
  };
}

// ─── Helper: inject headers into a RequestHeaders copy ────────────────────
function applyHeaders(base, extra) {
  const headers = new Headers(base);
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  return headers;
}

// ─── Helper: 429 Too Many Requests response ────────────────────────────────
function tooManyRequests(rlInfo, secHeaders) {
  const headers = {
    "Content-Type": "application/json",
    "Retry-After":  String(Math.max(0, rlInfo.reset - Math.ceil(Date.now() / 1000))),
    ...rateLimitHeaders(rlInfo),
    ...secHeaders,
  };
  return new NextResponse(
    JSON.stringify({
      error:   "Too Many Requests",
      message: "You are sending requests too quickly. Please slow down and try again shortly.",
      tier:    rlInfo.tier,
    }),
    { status: 429, headers }
  );
}

// ──────────────────────────────────────────────────────────────────────────
export async function middleware(request) {
  const { pathname, origin } = request.nextUrl;

  // ── 1. Build security headers object (applied to every response) ─────────
  const secHeaders = buildSecurityHeaders();

  // ── 2. Determine client IP ────────────────────────────────────────────────
  //    Vercel sets x-forwarded-for; fall back to request.ip for local dev.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.ip ||
    "unknown";

  // ── 3. Rate limiting ──────────────────────────────────────────────────────
  //    Skip for static assets and cron routes.
  const shouldRateLimit = !rateLimitSkipPaths.some((p) =>
    pathname.startsWith(p)
  );

  if (shouldRateLimit) {
    const rlInfo = await checkRateLimit(ip, pathname);

    if (!rlInfo.allowed) {
      return tooManyRequests(rlInfo, secHeaders);
    }

    // Attach rate-limit info to request headers for downstream logging
    secHeaders["X-RateLimit-Limit"]     = String(rlInfo.limit);
    secHeaders["X-RateLimit-Remaining"] = String(rlInfo.remaining);
    secHeaders["X-RateLimit-Reset"]     = String(rlInfo.reset);
    secHeaders["X-RateLimit-Tier"]      = rlInfo.tier || "UNKNOWN";
  }

  // ── 4. Build final request headers (security + rate-limit metadata) ──────
  const requestHeaders = applyHeaders(request.headers, secHeaders);

  // ── 5. Maintenance mode check ─────────────────────────────────────────────
  const secureCookie = request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";

  const isBypassPath = maintenanceBypassPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!isBypassPath) {
    const maintenanceActive = await isMaintenanceModeActive();
    if (maintenanceActive) {
      const tokenForMaintenance = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
        secureCookie,
      });
      const role = tokenForMaintenance?.role?.toUpperCase();
      if (role !== "ADMIN") {
        return NextResponse.redirect(new URL("/maintenance", origin));
      }
    }
  }

  // ── 6. Public paths → pass through ───────────────────────────────────────
  const isPublicPath = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (isPublicPath) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── 7. Auth token resolution ──────────────────────────────────────────────
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    secureCookie,
  });

  // ── 8. Protected path checks ──────────────────────────────────────────────
  const requiresAuth   = authenticatedPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAdminPath    = adminPaths.some((p)    => pathname === p || pathname.startsWith(`${p}/`));
  const isTeacherPath  = teacherPaths.some((p)  => pathname === p || pathname.startsWith(`${p}/`));
  const isStudentPath  = studentPaths.some((p)  => pathname === p || pathname.startsWith(`${p}/`));

  // Not authenticated → redirect to login
  if ((requiresAuth || isAdminPath || isTeacherPath || isStudentPath) && !token) {
    const signInUrl = new URL("/auth/login", origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // ── 9. Role-based access control ─────────────────────────────────────────
  if (token) {
    const userRole = token.role?.toUpperCase();

    // Admin has full access
    if (userRole === "ADMIN") {
      requestHeaders.set("x-user-role", "ADMIN");
      requestHeaders.set("x-user-id",   token.sub || "");
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // Teacher: admin paths + teacher + student paths + authenticated paths
    if (userRole === "TEACHER" && (isAdminPath || isTeacherPath || isStudentPath || requiresAuth)) {
      requestHeaders.set("x-user-role", "TEACHER");
      requestHeaders.set("x-user-id",   token.sub || "");
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // Student: student paths + authenticated paths
    if (userRole === "STUDENT" && (isStudentPath || requiresAuth)) {
      requestHeaders.set("x-user-role", "STUDENT");
      requestHeaders.set("x-user-id",   token.sub || "");
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // Forbidden — authenticated but wrong role
    if (isAdminPath || isTeacherPath) {
      return new NextResponse(
        JSON.stringify({ message: "You do not have permission to access this page." }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...secHeaders },
        }
      );
    }

    // Attach user context for all other authenticated routes
    requestHeaders.set("x-user-role", token.role || "GUEST");
    requestHeaders.set("x-user-id",   token.sub  || "");
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

// ─── Matcher: all routes except static files ──────────────────────────────
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
