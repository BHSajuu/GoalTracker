import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // 1. Try to get IP from headers (Standard for Vercel/Production)
  let ip = request.headers.get("x-forwarded-for")?.split(",")[0] || 
           request.headers.get("x-real-ip");

  let city = "Unknown";
  let country = "Unknown";

  // 2. If no header IP (likely Localhost), or if we want Geo data, try external API
  try {
    const response = await fetch("https://ipapi.co/json/", {
      cache: "no-store",
    });
    
    if (response.ok) {
      const data = await response.json();
      // Prefer the external API's IP because on localhost it gives your real Public IP
      if (data.ip) {
        ip = data.ip;
        city = data.city || "Unknown";
        country = data.country_name || "Unknown";
      }
    }
  } catch (error) {
    console.error("Geo API failed", error);
  }

  // 3. Absolute Fallback for Localhost if everything fails
  if (!ip || ip === "::1") {
    ip = "127.0.0.1";
  }

  return NextResponse.json({
    ip,
    city,
    country
  });
}