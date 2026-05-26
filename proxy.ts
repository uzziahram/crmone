import { NextRequest, NextResponse } from "next/server";

function unauthorizedRedirect(req: NextRequest) {
  const loginUrl = new URL("/loginpage", req.url);
  return NextResponse.redirect(loginUrl);
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = req.cookies.get("role")?.value;
  const token = req.cookies.get("token")?.value;

  const isAdminPath = pathname.startsWith("/admin");
  const isCustomerPath = pathname.startsWith("/customer");
  const isAdminApiPath =
    pathname.startsWith("/api/reviews") ||
    pathname.match(/^\/api\/products\/\d+\/stock$/) !== null ||
    (pathname.match(/^\/api\/products\/\d+$/) !== null && req.method === "DELETE");

  if (isAdminPath || isAdminApiPath) {
    if (!token || role !== "admin") {
      return unauthorizedRedirect(req);
    }
  }

  if (isCustomerPath) {
    if (!token || role !== "customer") {
      return unauthorizedRedirect(req);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/customer/:path*", "/api/reviews", "/api/products/:path*"],
};
