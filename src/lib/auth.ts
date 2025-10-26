import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from './prisma';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials);

          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              operations: {
                include: {
                  operation: true,
                },
              },
            },
          });

          if (!user || !user.password) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(password, user.password);

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            language: user.language,
            mustChangePassword: user.mustChangePassword,
            operations: user.operations,
            badgeNumber: user.badgeNumber,
            phoneNumber: user.phoneNumber,
            emailNotifications: user.emailNotifications,
            smsNotifications: user.smsNotifications,
            notificationLanguage: user.notificationLanguage,
          } as any;
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update' && session) {
        // Handle session updates (like mustChangePassword changes)
        token = { ...token, ...session };
        return token;
      }

      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as any).role;
        token.language = (user as any).language;
        token.mustChangePassword = (user as any).mustChangePassword;
        token.operations = (user as any).operations;
        token.badgeNumber = (user as any).badgeNumber;
        token.phoneNumber = (user as any).phoneNumber;
        token.emailNotifications = (user as any).emailNotifications;
        token.smsNotifications = (user as any).smsNotifications;
        token.notificationLanguage = (user as any).notificationLanguage;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        session.user.language = token.language as string;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
        session.user.operations = token.operations as any[];
        session.user.badgeNumber = token.badgeNumber as string;
        session.user.phoneNumber = token.phoneNumber as string;
        session.user.emailNotifications = token.emailNotifications as boolean;
        session.user.smsNotifications = token.smsNotifications as boolean;
        session.user.notificationLanguage = token.notificationLanguage as string;
      }

      return session;
    },
  },
};

export async function getServerSession() {
  const { getServerSession: getNextAuthServerSession } = await import('next-auth');
  return getNextAuthServerSession(authOptions);
}