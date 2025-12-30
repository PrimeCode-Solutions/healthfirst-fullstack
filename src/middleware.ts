import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const userRole = token?.role;

    const adminRoutes = ["/dashboard/medicos", "/dashboard/clientes"];
    const staffRoutes = ["/dashboard/agendamentos"]; 
    const apiStaffRoutes = ["/api/appointments"]; 
    
    if (adminRoutes.some((route) => path.startsWith(route))) {
      if (userRole !== "ADMIN") {
        return NextResponse.rewrite(new URL("/forbidden", req.url));
      }
    }

    if (staffRoutes.some((route) => path.startsWith(route))) {
      if (userRole !== "ADMIN" && userRole !== "DOCTOR") {
        return NextResponse.rewrite(new URL("/forbidden", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/api/appointments/:path*"],
};