import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // 1. Try to get IP and Geo data from Vercel headers (Standard for Production)
  let ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
           request.headers.get("x-real-ip")?.trim();

  let city = request.headers.get("x-vercel-ip-city") ? decodeURIComponent(request.headers.get("x-vercel-ip-city")!) : "Unknown";
  let country = request.headers.get("x-vercel-ip-country") || "Unknown";

  // 2. If no header IP (likely Localhost), try external API
  if (!ip || ip === "::1" || ip === "127.0.0.1") {
    try {
      const response = await fetch("https://ipapi.co/json/", {
        cache: "no-store",
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ip) {
          ip = data.ip;
          city = data.city || "Unknown";
          country = data.country_name || "Unknown";
        }
      }
    } catch (error) {
      console.error("Geo API failed", error);
    }
  }

  // 3. Absolute Fallback
  if (!ip) {
    ip = "127.0.0.1";
  }

  return NextResponse.json({
    ip,
    city,
    country
  });
}