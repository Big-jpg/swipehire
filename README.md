# SwipeHire - Tinder-Style Job Search Platform

SwipeHire is a modern job search platform that brings the simplicity of dating apps to job hunting. Swipe right on opportunities you love, left on ones you don't, and let AI match you with the perfect role.

## Features

- **Swipe Interface**: Intuitive Tinder-style job browsing with left/right swipe actions
- **AI-Powered Matching**: Get instant feedback on job qualification using LLM analysis
- **Smart Filtering**: Jobs filtered by location, salary, experience, and work mode preferences
- **Profile Management**: Comprehensive profile with skills, experience, and preferences
- **CV Upload**: Upload and parse PDF/DOCX resumes for better matching
- **Application Tracking**: Queue and track job applications with status updates
- **History Dashboard**: View all swipes and application history
- **Keyboard Shortcuts**: Use arrow keys to swipe, Z to undo
- **Undo Functionality**: Change your mind? Undo your last swipe

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Wouter
- **Backend**: Express 4, tRPC 11, Node.js
- **Database**: MySQL/TiDB with Drizzle ORM
- **Authentication**: Manus OAuth
- **File Storage**: S3-compatible storage
- **AI**: LLM integration for job matching
- **Testing**: Vitest

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- MySQL/TiDB database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Big-jpg/swipehire.git
cd swipehire
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
The following environment variables are automatically provided by the Manus platform:
- `DATABASE_URL` - MySQL/TiDB connection string
- `JWT_SECRET` - Session cookie signing secret
- `VITE_APP_ID` - Manus OAuth application ID
- `OAUTH_SERVER_URL` - Manus OAuth backend base URL
- `VITE_OAUTH_PORTAL_URL` - Manus login portal URL
- `BUILT_IN_FORGE_API_URL` - Manus built-in APIs (LLM, storage, etc.)
- `BUILT_IN_FORGE_API_KEY` - Bearer token for Manus APIs

4. Run database migrations:
```bash
pnpm db:push
```

5. Seed sample jobs:
```bash
pnpm tsx scripts/seedJobs.ts
```

6. Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
swipehire/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   │   ├── Home.tsx           # Landing page
│   │   │   ├── Dashboard.tsx      # Main dashboard
│   │   │   ├── Onboarding.tsx     # Profile setup
│   │   │   ├── Swipe.tsx          # Swipe interface
│   │   │   ├── History.tsx        # Swipe/application history
│   │   │   └── Profile.tsx        # Profile editing
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/          # tRPC client
│   │   └── App.tsx       # Routes & layout
├── server/                # Backend tRPC server
│   ├── routers.ts        # tRPC procedures
│   ├── db.ts             # Database query helpers
│   ├── ai/
│   │   └── matchCandidate.ts  # AI matching logic
│   └── *.test.ts         # Vitest tests
├── drizzle/              # Database schema & migrations
│   └── schema.ts         # Table definitions
├── scripts/              # Utility scripts
│   └── seedJobs.ts       # Job seeding script
└── shared/               # Shared types & constants
```

## Key Features Explained

### Swipe Interface

The swipe interface presents job cards one at a time with the following information:
- Company logo and name
- Job title and location
- Salary range and work mode
- AI qualification assessment
- Job summary and perks

Users can:
- Click "Not Interested" or "Apply" buttons
- Use keyboard shortcuts (← → arrows)
- Press Z to undo the last swipe
- View full job description in a modal

### AI Matching

The AI matching system analyzes:
- User's CV content
- Profile information (skills, experience, location)
- Job requirements and description

It returns:
- Qualification status (qualified/not qualified)
- Brief reasoning explaining the decision

### Profile & Preferences

Users can set:
- Location (city, country)
- Salary range and currency
- Years of experience
- Current and desired role titles
- Work mode preferences (remote, hybrid, onsite)
- Skills list
- CV/Resume upload

### Application Management

When users swipe right (like) a job:
- A swipe record is created with AI qualification data
- An application is automatically queued
- Application status can be: queued, submitted, or failed

## API Endpoints (tRPC)

### Profile
- `profile.me` - Get current user's profile and resume
- `profile.update` - Update profile information

### Resume
- `resume.upload` - Upload CV file (PDF/DOCX)

### Swipe
- `swipe.next` - Get next job card with AI matching
- `swipe.decision` - Record swipe decision (like/dislike)
- `swipe.undo` - Undo last swipe

### History
- `history.swipes` - Get swipe history (optional filter by decision)
- `history.applications` - Get application history with status

### Admin
- `admin.createJob` - Create new job listing (admin only)
- `admin.listJobs` - List all jobs (admin only)
- `admin.getJob` - Get job details (admin only)

## Testing

Run the test suite:
```bash
pnpm test
```

Tests cover:
- Profile creation and updates
- Swipe functionality and filtering
- Undo operations
- Application creation
- Authentication flows

## Database Schema

### users
Core user authentication table

### profiles
User job search preferences and information

### resumes
Uploaded CV files with parsed text content

### jobs
Job listings with comprehensive details

### swipes
User swipe decisions with AI qualification results

### applications
Job application queue and status tracking

## Seeding Jobs

To add sample jobs to the database:
```bash
pnpm tsx scripts/seedJobs.ts
```

This creates 8 sample jobs across different roles and locations.

## Admin Features

Users with admin role can:
- Create new job listings via `admin.createJob`
- View all jobs via `admin.listJobs`
- Access job details via `admin.getJob`

To promote a user to admin, update the `role` field in the database:
```sql
UPDATE users SET role = 'admin' WHERE id = <user_id>;
```

## Development Workflow

1. Update schema in `drizzle/schema.ts`
2. Run `pnpm db:push` to apply migrations
3. Add database helpers in `server/db.ts`
4. Add procedures in `server/routers.ts`
5. Build UI in `client/src/pages/`
6. Write tests in `server/*.test.ts`
7. Run `pnpm test` to verify

## Contributing

This project is set up for continuous development via GitHub. To contribute:

1. Create a feature branch
2. Make your changes
3. Write tests for new features
4. Run `pnpm test` to ensure all tests pass
5. Submit a pull request

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
