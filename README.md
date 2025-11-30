# Book Manager MVP

A StoryGraph-inspired book management application built as a local, offline-first MVP. This application allows users to manage their personal book collection, track reading progress, and organize books by status.

## Features

For a complete feature list and detailed specifications, see:
- [Features Summary](./docs/FEATURES_SUMMARY.md) - Quick reference of all MVP features
- [PRD - Core Features](./docs/PRD.md#3-core-features) - Detailed feature specifications
- [User Stories](./docs/USER_STORIES.md) - Detailed user stories organized by epic

**Key Features:**
- User Profile Management - See [PRD Section 3.1](./docs/PRD.md#31-user-profile-management)
- Book Database - See [PRD Section 3.2](./docs/PRD.md#32-book-database-management)
- Personal Collection - See [PRD Section 3.3](./docs/PRD.md#33-user-book-collection)
- Reading Status Management - See [PRD Section 3.4](./docs/PRD.md#34-reading-status-management)
- Series Management - See [PRD Section 3.2.1](./docs/PRD.md#321-add-books-to-database) and [USER_STORIES.md Epic 7](./docs/USER_STORIES.md)
- Search & Filter - See [PRD Section 3.3.2](./docs/PRD.md#332-manage-my-books)
- Bulk Operations - See [PRD Section 4.5](./docs/PRD.md#45-bulk-operations-flow)

## Tech Stack

For detailed technical requirements and recommendations, see [PRD Section 5 - Technical Requirements](./docs/PRD.md#5-technical-requirements).

**Current Implementation:**
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Database**: SQLite (using sql.js for browser-based storage)
- **Storage**: localStorage (database stored in browser)
- **Routing**: React Router v6

## Setup

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
book-manager/
├── src/
│   ├── components/      # React components
│   │   ├── Layout.tsx
│   │   ├── Navigation.tsx
│   │   └── BookCard.tsx
│   ├── context/         # React context providers
│   │   └── AppContext.tsx
│   ├── db/              # Database layer
│   │   ├── database/     # Modular database operations
│   │   │   ├── core.ts       # Database initialization & shared utilities
│   │   │   ├── users.ts      # User operations
│   │   │   ├── books.ts      # Book operations
│   │   │   ├── genres.ts     # Genre operations
│   │   │   ├── series.ts     # Series operations
│   │   │   ├── user-books.ts # User book collection operations
│   │   │   ├── reading-counts.ts # Reading count operations
│   │   │   ├── statistics.ts # Statistics operations
│   │   │   ├── test-helpers.ts # Test helper functions
│   │   │   └── index.ts      # Re-exports all functions
│   │   ├── database.ts  # Backward compatibility wrapper
│   │   ├── db-helpers.ts # SQL.js helper functions
│   │   ├── schema.ts    # Database schema definition
│   │   └── data-io.ts   # Data import/export functions
│   ├── pages/           # Page components
│   │   ├── ProfileSetup.tsx
│   │   ├── Profile.tsx
│   │   ├── Explore.tsx
│   │   ├── MyBooks.tsx
│   │   ├── AddBook.tsx
│   │   ├── BookDetail.tsx
│   │   └── SeriesDetail.tsx
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── docs/                # Documentation (see [docs/README.md](./docs/README.md))
│   ├── PRD.md           # Product Requirements Document
│   ├── USER_STORIES.md  # User Stories
│   ├── DATA_MODELS.md   # Data Models Specification
│   └── FEATURES_SUMMARY.md # Quick feature reference
├── specs/               # Test specifications and plans
├── tests/               # Playwright tests
└── package.json
```

## Usage

For detailed user flows and acceptance criteria, see:
- [PRD Section 4 - User Flows](./docs/PRD.md#4-user-flows) - Complete user flow documentation
- [USER_STORIES.md](./docs/USER_STORIES.md) - Detailed user stories with acceptance criteria
- [PRD Section 6 - UI/UX Requirements](./docs/PRD.md#6-uiux-requirements) - Interface specifications

### Quick Start Guide

**First Time Setup:** See [PRD Section 4.1](./docs/PRD.md#41-first-time-user-flow) and [USER_STORIES.md Epic 1](./docs/USER_STORIES.md#epic-1-user-profile-management)

**Adding Books:** See [PRD Section 4.2](./docs/PRD.md#42-adding-a-new-book-flow) and [USER_STORIES.md US-2.1](./docs/USER_STORIES.md#us-21-add-book-to-database)

**Managing Reading Status:** See [PRD Section 4.3](./docs/PRD.md#43-managing-reading-status-flow) and [PRD Section 3.4.1](./docs/PRD.md#341-set-reading-status)

**Filtering and Searching:** See [PRD Section 4.4](./docs/PRD.md#44-filtering-and-searching-flow)

**Bulk Operations:** See [PRD Section 4.5](./docs/PRD.md#45-bulk-operations-flow)

## Database

For complete database schema, data models, and storage information, see:
- [DATA_MODELS.md](./docs/DATA_MODELS.md) - Complete data model definitions, TypeScript interfaces, and SQL schema
- [PRD Section 5.2](./docs/PRD.md#52-data-storage) - Data storage architecture
- [PRD Section 5.4](./docs/PRD.md#54-database-schema) - Database schema overview

**Current Implementation:**
- Database stored in browser's localStorage (SQLite via sql.js)
- All data stored locally and persists across sessions
- Schema created automatically on first load
- For backup, export localStorage data or use the database export functionality

## Development Notes

### Database Layer

The database layer uses sql.js (SQLite compiled to WebAssembly). For schema details, see [DATA_MODELS.md](./docs/DATA_MODELS.md) and [PRD Section 5.4](./docs/PRD.md#54-database-schema). Schema is created automatically on first load.

**Architecture:**
- The database layer is organized into modular files by domain (users, books, genres, series, etc.)
- Core database initialization and shared utilities are in `src/db/database/core.ts`
- Each domain has its own module file (e.g., `users.ts`, `books.ts`)
- All functions are re-exported through `src/db/database/index.ts` for easy importing
- The original `database.ts` file maintains backward compatibility by re-exporting from the modular structure

**Type Safety:**
- All database operations use proper TypeScript types (no `any` types)
- Generic types are used in database helper functions for type-safe query results
- BookFormat enum values are validated when parsing from database strings

**Error Handling:**
- Database initialization errors are caught and displayed to users with recovery options
- User-friendly error messages are shown when database operations fail
- Error state is managed through React Context for consistent error handling

### State Management

The app uses React Context for global state management (user profile). Database queries are made directly from components. See [PRD Section 5.1](./docs/PRD.md#51-technology-stack-recommendations) for architecture details.

### Styling

The app uses a purple/lavender theme (#b189e8) inspired by StoryGraph. Styles are in `src/index.css` with CSS variables for easy theming. See [PRD Section 6.1](./docs/PRD.md#61-design-principles) for design requirements.

## Testing

For testing requirements and test plans, see:
- [PRD Section 10 - Testing Requirements](./docs/PRD.md#10-testing-requirements) - Functional and acceptance testing requirements
- [specs/](./specs/) directory - Test plans and scenarios

**Running Tests:**
```bash
npm test
```

## Known Limitations & Future Enhancements

For a complete list of MVP limitations and out-of-scope features, see [PRD Section 8 - Out of Scope](./docs/PRD.md#8-out-of-scope-future-features).

**MVP Limitations:**
- Single user per instance (MVP limitation)
- Database stored in localStorage (limited to ~5-10MB in most browsers)
- No image uploads (only URLs supported)

**Future Enhancements:**
See [PRD Section 8](./docs/PRD.md#8-out-of-scope-future-features) for a complete list, including:
- Import from external sources (Goodreads, Amazon, etc.)
- Export functionality
- Statistics and analytics
- Reading challenges
- Social features

## Documentation

Comprehensive documentation is available in the `docs/` folder:
- **[docs/README.md](./docs/README.md)** - Documentation index and quick start guide
- **[PRD.md](./docs/PRD.md)** - Complete Product Requirements Document
- **[FEATURES_SUMMARY.md](./docs/FEATURES_SUMMARY.md)** - Quick feature reference
- **[USER_STORIES.md](./docs/USER_STORIES.md)** - Detailed user stories by epic
- **[DATA_MODELS.md](./docs/DATA_MODELS.md)** - Data models and database schema
- **[TECHNICAL_NOTES.md](./docs/TECHNICAL_NOTES.md)** - Technical implementation details and architecture

## License

ISC

## Disclaimer

This application is **not a copy** of the StoryGraph application. It is an independent project **inspired by** StoryGraph's design and functionality. Any similarities in design or features are for inspiration purposes only.
