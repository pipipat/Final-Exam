//src/app/api/auth/logout/route.js

import { cookieOptions } from "@/lib/auth";
import { successResponse } from "@/lib/utils";

export async function POST() {
  const response = successResponse(
    { message: "Logged out" },
    200
  );

  response.cookies.set("token", "", {
    ...cookieOptions,
    maxAge: 0,
  });

  response.headers.set("Cache-Control", "no-store");

  return response;
}