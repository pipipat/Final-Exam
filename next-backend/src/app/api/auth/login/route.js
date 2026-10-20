//src/app/api/auth/login/route.js

import bcrypt from "bcrypt";
import { getDb } from "@/lib/mongodb";
import {
  createToken,
  cookieOptions,
  publicUser,
} from "@/lib/auth";
import {
  errorResponse,
  successResponse,
  printExceptionLog,
} from "@/lib/utils";

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const identifier =
    body?.identifier ?? body?.email ?? body?.username;

  const password = body?.password;

  if (
    typeof identifier !== "string" ||
    !identifier.trim() ||
    identifier.length > 254 ||
    typeof password !== "string" ||
    !password ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return errorResponse(
      "Enter your username/email and password",
      400
    );
  }

  try {
    const db = await getDb();
    const value = identifier.trim().toLowerCase();

    const user = await db.collection("users").findOne({
      $or: [
        { email: value },
        { username: value },
      ],
    });

    if (
      !user ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return errorResponse(
        "Invalid username/email or password",
        401
      );
    }

    if (!["student", "teacher"].includes(user.role)) {
      return errorResponse(
        "This account has no supported role",
        403
      );
    }

    const response = successResponse(
      { user: publicUser(user) },
      200
    );

    response.cookies.set(
      "token",
      createToken(user),
      cookieOptions
    );

    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    printExceptionLog("Login", error);

    return errorResponse(
      "Unable to log in. Please try again.",
      500
    );
  }
}