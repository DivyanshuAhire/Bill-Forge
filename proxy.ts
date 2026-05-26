import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/jwt";

const protectedRoutes = ["/dashboard", "/customers", "/products", "/invoices", "/settings", "/admin"];
const adminRoutes = ["/admin"];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => path.startsWith(route));

  if (isProtectedRoute) {
    const token = req.cookies.get("session")?.value;
    const session = await decrypt(token);

    if (!session) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    if (isAdminRoute && session.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    
    // If super admin tries to access company routes, redirect to admin
    if (!isAdminRoute && session.role === "SUPER_ADMIN") {
       return NextResponse.redirect(new URL("/admin", req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
