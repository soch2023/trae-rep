# Chess.replit

## Overview

A full-featured chess application built with React and Express. The app provides an interactive chess playing experience with multiple game modes (local two-player, vs AI, AI vs AI), real-time position evaluation using the Stockfish chess engine, and integration with the Lichess Masters opening database. The interface features a dark theme optimized for focus and concentration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom plugins for Replit integration
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React hooks for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ES Modules)
- **API Pattern**: RESTful endpoints defined in `shared/routes.ts` with Zod validation
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Build**: esbuild for server bundling, Vite for client

### Chess Engine Integration
- **Engine**: Stockfish WASM loaded as a Web Worker from `/stockfish.js`
- **Usage**: Real-time position evaluation, best move calculation, AI opponent moves
- **Hook**: Custom `useStockfish` hook manages worker lifecycle and message parsing

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Current Tables**: `user_settings` - stores per-session preferences (game mode toggles, AI difficulty)
- **Session Management**: Browser localStorage generates unique session IDs for anonymous persistence

### Key Design Patterns
- **Shared Types**: Schema and route definitions in `shared/` folder used by both client and server
- **Monorepo Structure**: Single package with `client/`, `server/`, and `shared/` directories
- **Type-safe API**: Zod schemas validate both input and output at API boundaries
- **Component Library**: Reusable UI primitives in `client/src/components/ui/`

### Development vs Production
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Static files served from `dist/public`, server bundled to `dist/index.cjs`

## External Dependencies

### Chess Libraries
- **chess.js**: Core game logic, move validation, FEN/PGN handling
- **react-chessboard**: React component for board rendering

### External APIs
- **Lichess Masters Database**: `https://explorer.lichess.ovh/masters` - fetches opening statistics and master game data for current positions (read-only, no auth required)

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle Kit**: Schema migrations with `npm run db:push`

### UI Framework Dependencies
- **Radix UI**: Accessible component primitives (dialogs, menus, toggles, etc.)
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **class-variance-authority**: Component variant management

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string (required for server startup)