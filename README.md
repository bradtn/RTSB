# Shift Bidding System

A modern, real-time shift bidding management system built with Next.js, featuring bilingual support (English/French), role-based authentication, and live updates.

## Features

- 🌐 **Bilingual Support**: Full support for English and Canadian French
- 🔐 **Secure Authentication**: Role-based access control (Super Admin, Supervisor, Officer)
- 📅 **Real-Time Bidding**: Live updates as bid lines become available or are claimed
- ⭐ **Favorites System**: Tag and track desired bid lines
- 🔔 **Smart Notifications**: Get alerts when favorite lines change status
- 📱 **Responsive Design**: Mobile-friendly interface
- 📊 **Analytics Dashboard**: Comprehensive reporting and activity tracking
- 🏢 **Multi-Department**: Support for multiple operations (Traffic, Commercial, etc.)

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io
- **Internationalization**: next-i18next
- **UI Components**: Radix UI
- **State Management**: TanStack Query
- **Forms**: React Hook Form with Zod validation
- **Notifications**: React Hot Toast

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd shift-bidding-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/shift_bidding"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Optional: Supabase (for real-time and auth)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# WebSocket
NEXT_PUBLIC_WEBSOCKET_URL="ws://localhost:3001"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. (Optional) Seed the database with sample data:
```bash
npx prisma db seed
```

## Development

Run the development server:
```bash
npm run dev
```

Run the WebSocket server:
```bash
npm run websocket
```

Or run both together:
```bash
npm run dev:all
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Management

View and manage your database:
```bash
npm run prisma:studio
```

Create a new migration:
```bash
npm run prisma:migrate
```

## Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
shift-bidding-system/
├── src/
│   ├── app/
│   │   ├── [locale]/         # Localized routes
│   │   ├── api/              # API routes
│   │   └── providers.tsx     # App providers
│   ├── components/           # React components
│   ├── lib/                  # Utility functions
│   └── types/               # TypeScript types
├── prisma/
│   └── schema.prisma        # Database schema
├── public/
│   └── locales/            # Translation files
├── websocket-server.js     # WebSocket server
└── package.json
```

## User Roles

### Super Admin
- Full system access
- Manage all operations and users
- Override any data
- View comprehensive analytics

### Supervisor
- Manage assigned operations
- Update bid line availability
- View operation statistics
- Manage operation users

### Officer
- View bid lines
- Favorite/tag desired lines
- Participate in active bidding periods
- Receive notifications

## Key Features Implementation

### Real-Time Updates
The system uses Socket.io for real-time bid line updates. When a line status changes, all connected clients receive instant updates.

### Bilingual Support
Full i18n implementation with:
- Language toggle in the header
- All UI text translated
- Locale-based routing (/en, /fr)
- User language preference saved

### Notifications
- Email notifications via Resend API
- In-app real-time notifications
- Configurable notification preferences

## API Endpoints

- `GET /api/bid-lines` - Fetch bid lines with filters
- `POST /api/bid-lines` - Create new bid line (Admin/Supervisor)
- `POST /api/bid-lines/[id]/favorite` - Toggle favorite status
- `POST /api/bid-lines/[id]/claim` - Claim a bid line
- `GET /api/operations` - Fetch operations
- `GET /api/notifications` - Get user notifications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.