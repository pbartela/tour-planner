# Project Overview: Plan Tour

## Purpose

Plan Tour is a web application for simplifying group trip planning. It allows users to:

- Create trip proposals with details (title, destination, dates, description)
- Invite participants via email
- Vote on trips using a "like" based system
- Discuss trips via comments
- Manage all aspects of group travel in one centralized location

The project solves common problems like scattered communication, lack of centralized information, and decision-making difficulties in group travel planning.

## Tech Stack

### Core Framework

- **Astro 5** (SSR mode with Node adapter) - Main framework
- **React 19** - For interactive components only
- **TypeScript 5** - Strict mode enabled with all strict flags

### Styling

- **Tailwind CSS 4** - Utility-first CSS framework
- **DaisyUI 5** - Component library
- **Shadcn/ui** - Additional UI components

### Backend & Database

- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (magic link passwordless auth)
  - Row Level Security (RLS)
  - Storage

### Forms & Validation

- **React Hook Form** - Form management
- **Zod** - Schema validation

### Additional Libraries

- **i18next** - Internationalization (en-US, pl-PL)
- **TanStack Query** - Server state management
- **date-fns** - Date manipulation
- **react-hot-toast** - Toast notifications

## Project Status

Currently in development, focusing on MVP features.

## Node Version

Node.js v22.14.0 (use `nvm use`)
