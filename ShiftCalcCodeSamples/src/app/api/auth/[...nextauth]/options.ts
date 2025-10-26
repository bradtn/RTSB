// src/app/api/auth/[...nextauth]/options.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import prisma from "@/lib/db/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          // Using $queryRaw for direct SQL query
          const users = await prisma.$queryRaw`
            SELECT * FROM users WHERE username = ${credentials.username}
          `;
          
          if (!Array.isArray(users) || users.length === 0) {
            return null;
          }
          
          const user = users[0];
          
          const isPasswordValid = await compare(credentials.password, user.password_hash);
          
          if (!isPasswordValid) {
            return null;
          }
          
          // Check if user must reset password from preferences
          let mustResetPassword = false;
          if (user.preferences) {
            try {
              const prefs = typeof user.preferences === 'string' ? 
                JSON.parse(user.preferences) : user.preferences;
              mustResetPassword = prefs.mustResetPassword === true;
            } catch (e) {
              // Silently handle parsing errors
            }
          }
          
          // Return user object that will be saved in the JWT
          return {
            id: String(user.id),
            name: user.full_name,
            email: user.username,
            role: user.role,
            mustResetPassword
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.mustResetPassword = user.mustResetPassword;
      }
      return token;
    },
    async session({ session, token }) {
      // Add role to the session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.mustResetPassword = token.mustResetPassword as boolean;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    signOut: "/"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "your-fallback-secret-development-only",
  debug: false,
}
