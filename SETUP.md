# Development Setup Guide

This guide will help you set up the Shift Bidding System for development on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+**: [Download from nodejs.org](https://nodejs.org/)
- **PostgreSQL**: [Download from postgresql.org](https://www.postgresql.org/download/)
- **Git**: [Download from git-scm.com](https://git-scm.com/)

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd shift-bidding-system

# Install dependencies
npm install
```

### 2. Database Setup

First, create a PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE shift_bidding;
CREATE USER shift_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE shift_bidding TO shift_user;
\q
```

### 3. Environment Configuration

Copy the environment file and configure it:

```bash
cp .env.local .env.local.backup
```

Edit `.env.local` with your settings:

```env
# Database Configuration
DATABASE_URL="postgresql://shift_user:your_password@localhost:5432/shift_bidding"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-minimum-32-characters-long"

# Email Service (Optional - for notifications)
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# WebSocket Server
NEXT_PUBLIC_WEBSOCKET_URL="ws://localhost:3001"

# Optional: Supabase (Alternative to PostgreSQL)
# NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
# NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
# SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 4. Database Migration and Seeding

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with sample data
npm run prisma:seed
```

### 5. Start Development Servers

Run both the Next.js app and WebSocket server:

```bash
# Start both servers concurrently
npm run dev:all

# Or run them separately:
# Terminal 1: Next.js app
npm run dev

# Terminal 2: WebSocket server
npm run websocket
```

### 6. Access the Application

- **Web App**: http://localhost:3000
- **Database Admin**: http://localhost:5555 (run `npm run prisma:studio`)

## Default Login Credentials

The seed script creates these test accounts:

```
Super Admin:
- Email: admin@example.com
- Password: admin123

Supervisor:
- Email: supervisor@example.com  
- Password: supervisor123

Officers:
- Email: officer1@example.com / officer123
- Email: officer2@example.com / officer123
- Email: officer3@example.com / officer123
```

## Development Features

### Language Support

The app supports English and French:
- Access via `/en` or `/fr` routes
- Language toggle in the header
- Test both languages during development

### Real-Time Features

- Bid line updates happen instantly across all connected clients
- WebSocket server handles real-time communications
- Test with multiple browser windows

### Database Management

```bash
# View/edit data graphically
npm run prisma:studio

# Create new migration after schema changes
npm run prisma:migrate

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Re-seed after reset
npm run prisma:seed
```

## Testing Different User Roles

### Super Admin Features
- Full system access
- User management
- Operations management  
- Activity logs
- System statistics

### Supervisor Features
- Manage assigned operations
- Update bid line availability
- View department statistics
- Limited user management

### Officer Features
- View and filter bid lines
- Favorite/unfavorite lines
- Add personal notes and tags
- Real-time notifications

## Email Notifications (Optional)

To test email functionality:

1. Sign up for a free [Resend](https://resend.com) account
2. Get your API key
3. Add it to `.env.local`
4. Test registration, line notifications, etc.

## Common Development Tasks

### Adding New Translations

1. Update `public/locales/en/common.json`
2. Update `public/locales/fr/common.json`
3. Use in components: `t('your.key')`

### Database Schema Changes

1. Modify `prisma/schema.prisma`
2. Run `npm run prisma:migrate`
3. Update seed data if needed

### Adding New API Routes

1. Create in `src/app/api/`
2. Follow existing patterns
3. Add proper authentication checks
4. Include activity logging

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
pg_ctl status

# Test connection
psql "postgresql://shift_user:your_password@localhost:5432/shift_bidding"
```

### Port Conflicts

Default ports:
- **3000**: Next.js app
- **3001**: WebSocket server
- **5432**: PostgreSQL
- **5555**: Prisma Studio

Change ports in package.json scripts if needed.

### Missing Dependencies

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Prisma Issues

```bash
# Regenerate client
npx prisma generate

# Reset Prisma
npx prisma migrate reset --force
```

## Production Deployment Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Generate secure `NEXTAUTH_SECRET`
- [ ] Set up proper PostgreSQL instance
- [ ] Configure email service
- [ ] Set up SSL/HTTPS
- [ ] Configure environment variables
- [ ] Test all user roles
- [ ] Verify real-time functionality
- [ ] Test bilingual content

## Next Steps

- Set up CI/CD pipeline
- Add comprehensive testing
- Configure monitoring and logging
- Set up backup procedures
- Review security best practices

## Support

For development questions:
- Check the README.md for general information
- Review the codebase structure
- Test with different user roles
- Use browser dev tools for debugging