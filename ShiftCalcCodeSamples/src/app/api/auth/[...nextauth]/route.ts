// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "./options";

console.log("Setting up NextAuth handler with options");

// Force environment variable for site URL if not set
if (typeof process.env.NEXTAUTH_URL === 'undefined') {
  process.env.NEXTAUTH_URL = process.env.NODE_ENV === 'production' ? "https://453.shiftcalc.ca" : "http://localhost:3005";
  console.log("Set NEXTAUTH_URL to", process.env.NEXTAUTH_URL);
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
