import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type Role = 'SUPER_ADMIN' | 'SUPERVISOR' | 'OFFICER';

export interface AuthenticatedRequest extends NextRequest {
  user: any;
}

type Handler = (
  request: AuthenticatedRequest,
  params?: any
) => Promise<NextResponse>;

interface AuthOptions {
  requiredRoles?: Role[];
  allowSelf?: boolean; // Allow users to access their own resources
}

/**
 * Middleware wrapper for API routes requiring authentication
 * Eliminates repetitive auth checks across all API routes
 */
export function withAuth(
  handler: Handler,
  options: AuthOptions = {}
) {
  return async (request: NextRequest, params?: any) => {
    try {
      const session = await getServerSession(authOptions);
      
      // Check if user is authenticated
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Check role requirements
      if (options.requiredRoles && options.requiredRoles.length > 0) {
        const hasRequiredRole = options.requiredRoles.includes(session.user.role as Role);
        
        // Check if user is accessing their own resource
        if (!hasRequiredRole && options.allowSelf) {
          const userId = params?.params?.id || request.nextUrl.searchParams.get('userId');
          if (userId !== session.user.id) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            );
          }
        } else if (!hasRequiredRole) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      // Add user to request
      (request as AuthenticatedRequest).user = session.user;
      
      // Call the actual handler
      return await handler(request as AuthenticatedRequest, params);
      
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Convenience wrappers for common role requirements
export const withSuperAdmin = (handler: Handler) => 
  withAuth(handler, { requiredRoles: ['SUPER_ADMIN'] });

export const withSupervisor = (handler: Handler) => 
  withAuth(handler, { requiredRoles: ['SUPER_ADMIN', 'SUPERVISOR'] });

export const withOfficer = (handler: Handler) => 
  withAuth(handler, { requiredRoles: ['SUPER_ADMIN', 'SUPERVISOR', 'OFFICER'] });

export const withAuthOnly = (handler: Handler) => 
  withAuth(handler, {});