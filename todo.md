# SwipeHire TODO

## Database Schema
- [x] Create profiles table with location, salary range, experience, skills, work mode preferences
- [x] Create resumes table for CV storage with S3 URL and parsed text
- [x] Create jobs table with comprehensive job details (title, company, location, salary, description, perks)
- [x] Create swipes table to track user decisions (like/dislike) with AI qualification results
- [x] Create applications table to manage application queue and status

## Backend API Routes
- [x] Implement profile management API (GET /api/profile/me, POST /api/profile)
- [x] Implement CV upload API (POST /api/resume/upload) with S3 storage and text parsing
- [x] Implement swipe feed API (GET /api/swipe/next) with filtering and AI matching
- [x] Implement swipe decision API (POST /api/swipe/decision) with application creation
- [x] Implement undo API (POST /api/swipe/undo)
- [x] Implement history APIs (GET /api/history/swipes, GET /api/history/applications)
- [x] Implement admin job creation API (POST /api/admin/jobs)

## AI Integration
- [x] Create AI matching module to analyze CV against job requirements
- [x] Implement structured JSON output with qualification status and reasoning
- [x] Integrate AI matching into swipe feed endpoint

## Frontend Components
- [x] Create landing page with product introduction and call-to-action
- [x] Build onboarding flow for profile creation and CV upload
- [x] Design swipe UI with job cards, left/right buttons, and keyboard shortcuts
- [x] Implement undo functionality in swipe interface
- [x] Create history dashboard with swipes and applications tabs
- [x] Build profile editing page

## Job Management
- [x] Create job seeding script with sample data
- [x] Implement admin API for manual job entry

## Testing
- [x] Write vitest tests for AI matching logic
- [x] Write vitest tests for swipe feed filtering and exclusion logic
- [x] Write vitest tests for profile and CV upload endpoints
- [x] Write vitest tests for swipe decision and undo functionality

## Deployment
- [ ] Push to GitHub repository (Big-jpg/invoicepipe)
- [ ] Configure for continuous development
- [ ] Create comprehensive README with setup instructions
