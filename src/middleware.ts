import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Lógica personalizada se necessário, por padrão protege todas as rotas no matcher
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, 
    },
    pages: {
      signIn: "/login", // Redireciona para cá se não autorizado
    },
  }
);


export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/appointments/:path*",
    "/api/users/:path*",
  ],
};