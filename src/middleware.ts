import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authRateLimit } from "@/lib/rate-limit";
import type { NextFetchEvent } from "next/server";

async function handleRateLimit(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/appointments")) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1";

    try {
      const { success } = await authRateLimit.limit(ip);

      if (!success) {
        return NextResponse.json(
          { error: "Muitas requisições. Tente novamente em breve." },
          { status: 429 }
        );
      }
    } catch (error) {
      console.error("Critical: Redis connection failed in Middleware:", error);
    }
  }
  return null;
}

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  
  const rateLimitResponse = await handleRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const authMiddleware = withAuth(
    function middleware(req) {
      const { pathname } = req.nextUrl;
      const token = req.nextauth?.token;
      const userRole = token?.role;

      const adminRoutes = ["/dashboard/medicos", "/dashboard/clientes"];
      const staffRoutes = ["/dashboard/agendamentos"];

      if (
        adminRoutes.some(route => pathname.startsWith(route)) &&
        userRole !== "ADMIN"
      ) {
        return NextResponse.rewrite(new URL("/forbidden", req.url));
      }

      if (
        staffRoutes.some(route => pathname.startsWith(route)) &&
        userRole !== "ADMIN" &&
        userRole !== "DOCTOR"
      ) {
        return NextResponse.rewrite(new URL("/forbidden", req.url));
      }

      return NextResponse.next();
    },
    {
      callbacks: {
        authorized: ({ req, token }) => {
          if (req.nextUrl.pathname.startsWith("/api/auth")) return true;
          return !!token;
        },
      },
      pages: {
        signIn: "/login",
      },
    }
  );

  
  // @ts-expect-error - O withAuth retorna um NextMiddleware que espera argumentos específicos
  return authMiddleware(req, event);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/auth/:path*",
    "/api/appointments/:path*",
  ],
};