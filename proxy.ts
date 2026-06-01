import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  getRoleHomePath,
  getRouteRule,
  isUserRole,
  type RoleCheckUser,
} from "@/lib/roles";

const AUTH_ROUTES = ["/login", "/register"] as const;

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

function redirectToRoleHome(request: NextRequest, user: RoleCheckUser) {
  if (!isUserRole(user.role)) {
    return redirectToLogin(request);
  }

  return NextResponse.redirect(new URL(getRoleHomePath(user.role), request.url));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request });
  const role = isUserRole(token?.role) ? token.role : null;
  const user = { role };

  if (AUTH_ROUTES.includes(pathname as (typeof AUTH_ROUTES)[number]) && role) {
    return redirectToRoleHome(request, user);
  }

  const routeRule = getRouteRule(pathname);

  if (!routeRule) {
    return NextResponse.next();
  }

  if (!token || !role) {
    return redirectToLogin(request);
  }

  if (!routeRule.allowedRoles.includes(role)) {
    return redirectToRoleHome(request, user);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
