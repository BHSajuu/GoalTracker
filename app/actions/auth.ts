"use server";

import { cookies } from "next/headers";

export async function createAuthSession(userId: string, email: string) {
  const cookieStore = await cookies();
  cookieStore.set("Zielio_session", JSON.stringify({ userId, email }), {
    httpOnly: true, // Cannot be accessed by JavaScript (Prevents XSS attacks)
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function getAuthSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("Zielio_session")?.value;
  
  if (!session) return null;
  
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

export async function destroyAuthSession() {
  const cookieStore = await cookies();
  cookieStore.delete("Zielio_session");
}