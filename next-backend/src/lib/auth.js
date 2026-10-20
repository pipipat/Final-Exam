import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getDb } from "./mongodb.js";

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 8,
};

export function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing");
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "8h",
    }
  );
}

export function verifyJWT(request) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token || !process.env.JWT_SECRET) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    return typeof decoded === "object" &&
      typeof decoded.id === "string" &&
      /^[a-f0-9]{24}$/i.test(decoded.id)
      ? decoded
      : null;
  } catch {
    return null;
  }
}

export function publicUser(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

export async function getCurrentUser(request) {
  const token = verifyJWT(request);

  if (!token) {
    return null;
  }

  const db = await getDb();

  const user = await db.collection("users").findOne(
    { _id: new ObjectId(token.id) },
    { projection: { password: 0 } }
  );

  if (!user || !["student", "teacher"].includes(user.role)) {
    return null;
  }

  return publicUser(user);
}