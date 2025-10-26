import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      language: string;
      mustChangePassword?: boolean;
      badgeNumber?: string;
      phoneNumber?: string;
      emailNotifications?: boolean;
      smsNotifications?: boolean;
      notificationLanguage?: string;
      operations: Array<{
        id: string;
        operationId: string;
        isSupervisor: boolean;
        operation: {
          id: string;
          name: string;
          nameEn: string;
          nameFr: string;
        };
      }>;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: string;
    language: string;
    mustChangePassword?: boolean;
    badgeNumber?: string;
    phoneNumber?: string;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    notificationLanguage?: string;
    operations: any[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    language: string;
    mustChangePassword?: boolean;
    badgeNumber?: string;
    phoneNumber?: string;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    notificationLanguage?: string;
    operations: any[];
  }
}