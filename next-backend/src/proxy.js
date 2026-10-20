import { NextResponse } from "next/server";
import { verifyJWT } from "./lib/auth";
import corsHeaders from "./lib/cors";
import {
  X_HEADER_USER_EMAIL,
  X_HEADER_USER_ID,
  X_HEADER_USER_NAME,
} from "./lib/constant";

export function proxy(request) {
  // Allow browser CORS preflight before authentication.
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const origin = request.headers.get("origin");

  if (
    !["GET", "HEAD"].includes(request.method) &&
    origin &&
    origin !== corsHeaders["Access-Control-Allow-Origin"] &&
    origin !== request.nextUrl.origin
  ) {
    return NextResponse.json(
      { message: "Origin is not allowed" },
      {
        status: 403,
        headers: corsHeaders,
      }
    );
  }

  const path = request.nextUrl.pathname.replace(/\/$/, "");

  // These endpoints must remain accessible without a valid token.
  if (
    ["/api/auth/login", "/api/auth/logout"].includes(path)
  ) {
    return NextResponse.next();
  }

  const user = verifyJWT(request);

  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized Request" },
      {
        status: 401,
        headers: corsHeaders,
      }
    );
  }

  // Preserve the header-based structure from the original code.
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set(X_HEADER_USER_ID, user.id);
  requestHeaders.set(X_HEADER_USER_EMAIL, user.email);
  requestHeaders.set(X_HEADER_USER_NAME, user.username);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/api/:path*"],
};