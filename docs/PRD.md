# Product Requirements Document (PRD)
## StoryGraph-like Book Management MVP

**Version:** 1.0  
**Date:** 2025-11-30 
**Status:** Draft

---

## 1. Executive Summary

This document outlines the product requirements for a local MVP application that is inspired by core functionality of StoryGraph (app.thestorygraph.com). The application will allow users to manage their personal book collection, track reading progress, and organize books by status.
The application is used **ONLY** as a local application for a test automation playground.
The data prepared in this application then could be used as a data source to update the user's profile at StoryGraph application in production.

**Disclaimer:** This application is **not a copy** of the StoryGraph application. It is an independent project **inspired by** StoryGraph's design and functionality. Any similarities in design or features are for inspiration purposes only, and this application is developed as a local MVP for testing and automation purposes.

### 1.1 Goals
- Provide a local, offline-first book management system
- Enable users to catalog and organize their personal library
- Track reading progress and status
- Support basic book metadata management

### 1.2 Success Metrics
- Users can successfully add books to their collection
- Users can manage reading status for all books
- Application works offline without external dependencies
- Core workflows complete in < 3 clicks

---

## 2. User Personas

### Primary Persona: Book Enthusiast
- **Name:** Alex
- **Age:** 25-45
- **Tech Savviness:** Medium to High
- **Goals:** 
  - Track books they own
  - Monitor reading progress
  - Organize books by reading status
- **Pain Points:**
  - Losing track of what books they own
  - Forgetting reading progress
  - No centralized place to manage collection

---

## 3. Core Features

### 3.1 User Profile Management

#### 3.1.1 Create User Profile
**Priority:** P0 (Must Have)

**Description:**  
Users must be able to create and manage their profile when first using the application.

**User Story:**  
As a new user, I want to create a profile so that I can start managing my book collection.

**Acceptance Criteria:**
- [ ] User can create a profile with:
  - Username (required, unique, 3-50 characters, alphanumeric + underscore/hyphen)
  - Display name (optional)
  - Email (optional, valid email format if provided)
  - Profile creation date (auto-generated)
- [ ] Profile is saved locally in the database
- [ ] User can view their profile information
- [ ] User can edit their profile information
- [ ] Profile persists across application sessions

**UI Requirements:**
- Simple registration form
- Profile view/edit page
- Profile information displayed in navigation/user menu

---

### 3.2 Book Database Management

#### 3.2.1 Add Books to Database
**Priority:** P0 (Must Have)

**Description:**  
Users can add books to the application's database. Books can be added manually or potentially imported from external sources.

**User Story:**  
As a user, I want to add books to the database so that I can build my collection.

**Acceptance Criteria:**
- [ ] User can manually add a book with the following fields:
  - Title (required)
  - Author (required)
  - ISBN (optional)
  - Publication year (optional)
  - Number of pages (optional)
  - Format (digital, physical, audiobook) (optional - if book has multiple formats, save as separate entries in database)
  - Genre tags (optional, multiple, free-form text, displayed as tags, max 20 genres per book, max 255 characters per genre, saved to separate table for re-use, genres are not locked for a book/user/series)
  - Cover image URL (optional, valid HTTP/HTTPS URL - if image fails to load, show book title and author name in a field; users cannot upload local images, only URLs)
  - Description/synopsis (optional, max 5000 characters - if more characters added, show error message)
- [ ] Book is saved to the database
- [ ] Duplicate detection (by ISBN or title+author combination)
- [ ] User receives confirmation when book is added
- [ ] User can view all books in the database

**UI Requirements:**
- "Add Book" button/form
- Book entry form with all fields
- Book list view showing all books in database
- Search functionality to find books in database

**Data Model:**
```typescript
interface Book {
  id: string; // UUID
  title: string;
  author: string;
  isbn?: string;
  asin?: string;
  seriesId?: string; // Foreign key to Series
  position?: number; // Optional, position within series
  publicationYear?: number;
  pages?: number;
  format?: 'digital' | 'physical' | 'audiobook';
  coverImageUrl?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 3.3 User Book Collection

#### 3.3.1 Add Books to User Profile
**Priority:** P0 (Must Have)

**Description:**  
Users can add books from the database to their personal collection/profile.

**User Story:**  
As a user, I want to add books from the database to my collection so that I can track which books I own.

**Acceptance Criteria:**
- [ ] User can browse/search the book database
- [ ] User can select a book and add it to their collection
- [ ] Book appears in user's "Owned Books" list
- [ ] User can add the same book only once (prevent duplicates)
- [ ] User receives confirmation when book is added to collection

**UI Requirements:**
- Book search/browse interface
- "Add to My Books" button on book details
- Confirmation message
- Navigation to "Owned Books" view

**Data Model:**
```typescript
interface UserBook {
  id: string; // UUID
  userId: string; // Foreign key to User
  bookId: string; // Foreign key to Book
  addedAt: Date; // When book was added to user's collection
  status: ReadingStatus;
  startedDate?: Date;
  finishedDate?: Date;
  progress: number; // Required, 0-100 percentage, default 0
}
```

---

#### 3.3.2 Manage Owned Books
**Priority:** P0 (Must Have)

**Description:**  
Users can view, organize, and manage all books in their collection.

**User Story:**  
As a user, I want to see and manage all the books I own so that I can keep track of my collection.

**Acceptance Criteria:**
- [ ] User can view all books in their collection
- [ ] Books are displayed in a list/grid view
- [ ] Each book card shows:
  - Cover image (if available)
  - Title
  - Author
  - Current reading status
  - Progress indicator (if applicable)
  - Date added
- [ ] User can filter books by:
  - Reading status
  - Genre
  - Author
  - Format
  - ISBN
  - ASIN
- [ ] Book count is calculated and displayed contextually where useful:
  - Owned Books page: "9 books" (total owned books count)
  - Explore page: total number of books in database
  - Search result page: "Found 3/300 books" (showing results count vs total database count)
  - Home page: total number of books in database
  - Book detail page: number of books in series (if the book is in a series)
- [ ] Book count display appears only where appropriate and useful (not on every page)
- [ ] Series count display: number of series user owns, displayed in Owned Books next to total number of owned books (a series can have multiple books, but 1 book cannot be in more than 1 series)
- [ ] User can sort books by:
  - Date added (latest first)
  - Title (A-Z)
  - Author (A-Z)
  - Publication year
  - Date started
  - Date finished
- [ ] User can search books in their collection (searches entire database, highlights owned books with "owned" tag)
- [ ] User can search by series name
- [ ] User can search by series author
- [ ] Books in series are highlighted with "series" tag in search results and book cards
- [ ] Series name detail is displayed for books in series
- [ ] User can remove books from their collection
- [ ] User can edit UserBook metadata (status, dates, progress) in their collection
- [ ] User can select multiple books for bulk operations (checkboxes on book cards)
- [ ] User can bulk remove multiple books from collection
- [ ] User can bulk edit metadata for multiple books (status, dates, progress)
- [ ] Bulk operations show count of selected books (e.g., "3 books selected")
- [ ] Confirmation dialog appears before bulk operations

**UI Requirements:**
- "Owned Books" page/view
- Book card component with all relevant information
- Checkbox on each book card for selection
- Bulk action toolbar (appears when books are selected)
- Filter sidebar/collapsible section
- Sort dropdown
- Search bar
- Book detail modal/page
- Remove/delete confirmation
- Bulk operation confirmation dialog

**Inspiration:** Based on StoryGraph's "Owned Books" interface with:
- Search functionality
- Filter list (collapsible)
- Sort options (Latest added, etc.)
- Book count display
- Individual book cards with cover, title, author, metadata

---

### 3.4 Reading Status Management

#### 3.4.1 Set Reading Status
**Priority:** P0 (Must Have)

**Description:**  
Users can set and update the reading status for books in their collection.

**User Story:**  
As a user, I want to mark books with different reading statuses so that I can track what I'm reading, what I've finished, and what I want to read.

**Acceptance Criteria:**
- [ ] User can set reading status to one of:
  - **To Read** - Books user wants to read in the future
  - **Currently Reading** - Books user is actively reading
  - **Read** - Books user has finished reading
  - **Didn't Finish** - Books user started but didn't complete
- [ ] Status can be changed at any time
- [ ] Status is displayed on book cards
- [ ] User can filter books by status
- [ ] Status change is saved immediately
- [ ] Status history is tracked (optional for MVP)

**UI Requirements:**
- Status dropdown/selector on book card or detail page
- Visual indicator of status (badge, color coding)
- Status filter in owned books view
- Quick status change from book list view

**Data Model:**
```typescript
enum ReadingStatus {
  TO_READ = 'to-read',
  CURRENTLY_READING = 'currently-reading',
  READ = 'read',
  DIDNT_FINISH = 'didnt-finish'
}
```

---

#### 3.4.2 Set Dates
**Priority:** P0 (Must Have)

**Description:**  
Users can set and track dates related to their reading activity.

**User Story:**  
As a user, I want to record when I started and finished reading books so that I can track my reading history.

**Acceptance Criteria:**
- [ ] User can set a "Started Date" when status changes to "Currently Reading"
- [ ] User can set a "Finished Date" when status changes to "Read"
- [ ] Dates can be set manually or auto-populated
- [ ] User can edit dates after they're set
- [ ] Dates are displayed on book cards when available
- [ ] User can filter/sort by dates
- [ ] Date format is user-friendly (e.g., "Started Nov 13, 2025")
- [ ] Date validation: started date cannot be in the future (only past or today)
- [ ] Date validation: finished date cannot be in the future (only past or today)
- [ ] Date validation: started date can be before book was added to collection (valid scenario, no error)
- [ ] Date validation: finished date can be set without started date (valid scenario, no error)
- [ ] Date validation: if finished date is before started date, show error message: "Start date must be prior to finish date"
- [ ] Date validation: "Didn't Finish" status can have finished date (equals the date when user decided to close the book as didn't-finish and will not read anymore; date can be changed in the future when moving to other statuses)

**UI Requirements:**
- Date picker component
- Date display on book cards
- "Started" and "Finished" date fields in book detail view
- Auto-populate option when changing status
- Date format: "Started [Date]" / "Finished [Date]"

**Data Model:**
- `startedDate?: Date` - When user started reading
- `finishedDate?: Date` - When user finished reading
- `addedAt: Date` - When book was added to collection (auto-set)

---

## 4. User Flows

### 4.1 First-Time User Flow
1. User opens application
2. User creates profile (username, display name, email)
3. User is taken to empty "Owned Books" view
4. User sees prompt to "Add Your First Book"
5. User adds a book to database
6. User adds book to their collection
7. User sets reading status and dates

### 4.2 Adding a New Book Flow
1. User navigates to "Add Book" page
2. User fills in book information (title, author required)
3. User optionally adds additional metadata
4. User clicks "Add to Database"
5. System checks for duplicates
6. Book is saved to database
7. User is prompted to "Add to My Books"
8. Book is added to user's collection with default status "To Read"
9. If book is already in collection, duplicate is prevented

### 4.3 Managing Reading Status Flow
1. User views "Owned Books" page
2. User clicks on a book card or selects book from list
3. User sees book details
4. User changes status via dropdown
5. **State Transitions:**
   - **New book added** → Default status "To Read", progress = 0
   - **"To Read" → "Read"** → See pop-up specification below
   - **"Read" → "To Read"** → See pop-up specification below
   - **"Read" → "Currently Reading"** → See pop-up specification below
   - **"Currently Reading" → "Read"** → See pop-up specification below
6. If changing to "Currently Reading", user can set start date (cannot be future)
7. If changing to "Read", user can set finish date (cannot be future), progress auto-updates to 100%
8. Changes are saved automatically
9. Book card updates to reflect new status

#### 4.3.1 State Transition Pop-up Specifications

**Pop-up: "To Read" → "Read"**
- **Trigger:** User changes status from "To Read" to "Read"
- **Title:** "Mark as Read?"
- **Message:** "Did you finish reading '[Book Title]'?"
- **Buttons:**
  - "Yes, I finished it" → Proceeds to date/progress input
  - "No, cancel" → Cancels status change, returns to "To Read"
- **If "Yes" clicked:**
  - Progress automatically set to 100%
  - User can set finish date (default: today, cannot be future)
  - User can optionally set start date
  - New entry added to `reading_count_logs` table
  - Status changes to "Read"
- **If "No" clicked:**
  - Status remains "To Read"
  - No changes to dates or progress

**Pop-up: "Currently Reading" → "Read"**
- **Trigger:** User changes status from "Currently Reading" to "Read"
- **Title:** "Mark as Finished?"
- **Message:** "Did you finish reading '[Book Title]'?"
- **Buttons:**
  - "Yes, I finished it" → Proceeds to date/progress update
  - "No, cancel" → Cancels status change, returns to "Currently Reading"
- **If "Yes" clicked:**
  - Progress automatically set to 100%
  - User can set finish date (default: today, cannot be future)
  - Start date remains unchanged (if previously set)
  - New entry added to `reading_count_logs` table
  - Status changes to "Read"
- **If "No" clicked:**
  - Status remains "Currently Reading"
  - No changes to dates or progress

**Pop-up: "Read" → "To Read" or "Read" → "Currently Reading"**
- **Trigger:** User changes status from "Read" to "To Read" or "Currently Reading"
- **Title:** "Change Reading Status"
- **Message:** "This book is currently marked as read. Are you starting a new reading session?"
- **Buttons:**
  - "Yes" → Proceeds with new dates/progress input
  - "Cancel" → Cancels status change, returns to "Read"
- **If "Yes" clicked:**
  - Original reading history remains visible (unchanged)
  - User can set new start date (for "Currently Reading") or leave blank (for "To Read")
  - Progress resets to 0 (for "To Read") or user-specified value (for "Currently Reading")
  - Original finished date and reading count remain visible but unchanged
  - Status changes to selected status
- **If "Cancel" clicked:**
  - Status remains "Read"
  - No changes to dates, progress, or reading count

### 4.4 Filtering and Searching Flow
1. User navigates to "Owned Books" page
2. User sees filter section (collapsible)
3. User expands filter section
4. User selects filter criteria (status, genre, author, etc.)
5. Book list updates to show filtered results
6. User can combine multiple filters
7. User can clear filters to see all books
8. User can use search bar to find specific books

### 4.5 Bulk Operations Flow
1. User navigates to "Owned Books" page
2. User enables selection mode (or checkboxes are always visible)
3. User selects multiple books by clicking checkboxes
4. Bulk action toolbar appears showing "X books selected"
5. **For Bulk Remove:**
   - User clicks "Bulk Remove" button
   - Confirmation dialog shows list/count of books to be removed
   - User confirms removal
   - Selected books are removed from collection
   - Confirmation message appears
6. **For Bulk Edit:**
   - User clicks "Bulk Edit" button
   - Bulk edit modal appears with form
   - User sets new values (status, dates, progress)
   - User previews changes
   - User clicks "Apply Changes"
   - Confirmation dialog appears
   - User confirms changes
   - Changes are applied to all selected books
   - Confirmation message appears
7. Selection is cleared after operation

---

## 5. Technical Requirements

### 5.1 Technology Stack (Recommendations)
- **Frontend:** React, Vue, or vanilla JavaScript/TypeScript
- **Database:** SQLite (local, file-based database)
- **Storage:** Local-first, offline-capable application
- **Architecture:** Client-side only, no backend server required

### 5.2 Data Storage
- **Books Database:** Central repository of all books (SQLite)
- **User Profile:** Single user account information (MVP supports one user per instance)
- **User Books:** Junction table linking user to books with status/metadata
- **Local Storage:** SQLite database file stored locally, fully offline-capable
- **No Backend Required:** All operations performed client-side with local database

### 5.4 Database Schema

**Note:** This schema is designed for SQLite. UUIDs are stored as TEXT and generated by the application layer. For complete schema with all tables and indexes, see [DATA_MODELS.md](./DATA_MODELS.md).

```sql
-- Users table (single user for MVP)
CREATE TABLE users (
  id TEXT PRIMARY KEY,  -- UUID stored as TEXT, generated by application
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT username_length CHECK (length(username) >= 3 AND length(username) <= 50)
);
-- Note: MVP supports single user per instance, no multi-user authentication needed
-- Username format validation (alphanumeric + underscore/hyphen) performed at application level
-- Email format validation performed at application level

-- Series table (created before books to allow foreign key reference)
CREATE TABLE series (
  id TEXT PRIMARY KEY,  -- UUID stored as TEXT, generated by application
  name TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_unique_series_name_author ON series(LOWER(name), LOWER(author));

-- Books table
CREATE TABLE books (
  id TEXT PRIMARY KEY,  -- UUID stored as TEXT, generated by application
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,  -- Validation performed at application level
  asin TEXT,  -- Validation performed at application level
  series_id TEXT REFERENCES series(id),
  position INTEGER CHECK (position IS NULL OR position > 0),
  publication_year INTEGER,
  pages INTEGER CHECK (pages IS NULL OR pages > 0),
  format TEXT CHECK (format IS NULL OR format IN ('digital', 'physical', 'audiobook')),
  cover_image_url TEXT,  -- Validation performed at application level
  description TEXT CHECK (description IS NULL OR length(description) <= 5000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT author_not_empty CHECK (length(trim(author)) > 0),
  CONSTRAINT publication_year_valid CHECK (publication_year IS NULL OR (publication_year >= 1000 AND publication_year <= CAST(strftime('%Y', 'now') AS INTEGER) + 1))
);
CREATE UNIQUE INDEX idx_unique_title_author ON books(LOWER(title), LOWER(author)); -- Prevent duplicates (case-insensitive)

-- User Books (junction table)
CREATE TABLE user_books (
  id TEXT PRIMARY KEY,  -- UUID stored as TEXT, generated by application
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'to-read' CHECK (status IN ('to-read', 'currently-reading', 'read', 'didnt-finish')),
  started_date DATE,  -- Date validation (no future dates) performed at application level
  finished_date DATE,  -- Date validation (no future dates, >= started_date) performed at application level
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_book UNIQUE (user_id, book_id), -- One book per user
  CONSTRAINT read_progress CHECK (status != 'read' OR progress = 100),
  CONSTRAINT finished_after_started CHECK (started_date IS NULL OR finished_date IS NULL OR finished_date >= started_date)
);

-- Indexes for performance
CREATE INDEX idx_user_books_user_id ON user_books(user_id);
CREATE INDEX idx_user_books_status ON user_books(status);
CREATE INDEX idx_books_title ON books(LOWER(title));
CREATE INDEX idx_books_author ON books(LOWER(author));
CREATE INDEX idx_books_series_id ON books(series_id) WHERE series_id IS NOT NULL;
```

**See [DATA_MODELS.md](./DATA_MODELS.md) for complete schema including genres, book_genres, and reading_count_logs tables.**

---

## 6. UI/UX Requirements

### 6.1 Design Principles
- **Clean, Minimal and Modern:** Inspired by StoryGraph's clean interface
- **Purple/Lavender Accent Color:** Use purple/lavender (#b189e8) as primary accent
- **White Background:** Clean, minimal background
- **Card-Based Layout:** Books displayed as cards with cover images
- **Responsive:** Works on desktop and tablet (mobile optional for MVP)

### 6.2 Key Pages/Views

#### 6.2.1 Navigation Bar
- Logo/Brand name
- Menu items: Explore, Stats (future), Challenges (future), Community (future)
- Search bar: "Search all books..." (searches entire book database, highlights books owned by user with "owned" tag - same behavior as Explore page)
- User profile icon/menu
- Note: Book count display shown contextually in search results (e.g., "Found 3/300 books") rather than in navigation bar

#### 6.2.2 Explore Page
- **Header:**
  - "Explore" title
  - Book count display (e.g., "300 books") - total number of books in database
  
- **Search and Filters:**
  - Search input: "Search all books..." (searches entire book database, highlights books owned by user with "owned" tag)
  - Search results show contextual count: "Found 3/300 books" (results count vs total database)
  - Collapsible "Filter list" section
  - Sort dropdown
  
- **Book List:**
  - Grid or list view of book cards
  - Books owned by user are highlighted with "owned" tag
  - Books in series are highlighted with "series" tag and show series name detail
  - Each card shows book information
  - "Add to My Books" button for books not in collection

#### 6.2.3 Owned Books Page
- **Header:**
  - "Owned Books" title with book icon
  - Book count display (e.g., "9 books") - real-time count of owned books
  - Series count display (e.g., "3 series") - number of series user owns, displayed next to total number of owned books (a series can have multiple books, but 1 book cannot be in more than 1 series)
  
- **Search and Filters:**
  - Search input: "Search books..." (searches only books owned by user)
  - Search results show contextual count: "Found 3/300 books" (results count vs total database)
  - Collapsible "Filter list" section
  - Sort dropdown: "Latest added" (default), Title A-Z, Author A-Z, etc.
  - When filters applied, show: "Showing 5 of 9 owned books" (filtered count vs total owned)
  
- **Book List:**
  - Grid or list view of book cards
  - Selection mode: checkbox on each book card for bulk operations
  - Bulk action toolbar (appears when books are selected):
    - Shows count: "3 books selected"
    - "Bulk Edit" button
    - "Bulk Remove" button
    - "Clear Selection" button
  - Each card shows:
    - Checkbox (for selection mode)
    - Cover image
    - Title
    - Author
    - Series information (if book is part of a series) - highlighted with "series" tag and series name detail
    - Metadata: pages, format, year, editions
    - Reading status badge
    - Progress bar (if currently reading)
    - Date information (Started/Finished)
    - Genre tags
    - Action buttons: "owned" tag (if book is in user's collection), "buy" (future)
    - Status dropdown
    - "Mark as finished" checkbox

#### 6.2.4 Add Book Page
- Form with all book fields
- Required fields clearly marked
- Optional fields grouped
- Cover image preview
- Save/Cancel buttons
- Note: Book count not displayed here (not useful context)

#### 6.2.5 Book Detail View
- Full book information
- Series information displayed (if part of series) with "series" tag and series name
- Series count display (if book is in a series) - shows number of books in the series (useful context)
- Edit button
- Status selector
- Date pickers
- Remove from collection button
- Note: Book count not displayed here (not useful context for single book view)

#### 6.2.6 Profile Page
- User information display
- Edit profile button
- Book count display (total owned books) - useful context for profile
- Series count display (total series user has books from) - useful context for profile
- Statistics (total books, reading stats) - optional for MVP

#### 6.2.7 Bulk Operations View
- Bulk Edit Modal/Dialog:
  - Shows count of selected books
  - Form to edit common metadata:
    - Reading status (apply to all selected)
    - Start date (apply to all selected)
    - Finish date (apply to all selected)
    - Progress (apply to all selected)
  - Option to apply changes to all or customize per book
  - Preview of changes before applying
  - Confirmation before applying changes
- Bulk Remove Confirmation:
  - Shows list of books to be removed
  - Count of books to be removed
  - Warning message
  - Confirmation required before removal

---

## 7. Non-Functional Requirements

### 7.1 Performance
- Page load time < 2 seconds
- Search results appear in < 500ms
- Smooth scrolling and interactions

### 7.2 Usability
- Intuitive navigation (max 3 clicks to any feature)
- Clear error messages
- Confirmation dialogs for destructive actions
- Auto-save for status/date changes

### 7.3 Data Integrity
- Prevent duplicate books in database (by title+author combination only - other parameters can vary)
- Prevent duplicate books in user collection
- Validate all required fields
- Validate date ranges (finished date >= started date)

### 7.4 Accessibility
- Keyboard navigation support
- Screen reader friendly
- High contrast mode
- Clear focus indicators

---

## 8. Out of Scope (Future Features)

The following features are **NOT** included in MVP but may be considered for future versions:

- Social features (sharing, following users)
- Book reviews and ratings
- Reading challenges
- Statistics and analytics (beyond basic counts)
- Book recommendations
- Import from external sources (Goodreads, Amazon, etc.)
- Export functionality (users can backup by copying database file)
- Mobile app
- Multi-user support (single user per instance for MVP)
- Book covers auto-fetching from APIs
- Reading notes and annotations
- Wishlist functionality
- Book lending/tracking

**Note:** Basic series management (create series, add books to series, view series) **IS** included in MVP. See Epic 7 in USER_STORIES.md for details.

---

## 9. Success Criteria

### MVP is considered successful when:
1. ✅ User can create a profile
2. ✅ User can add books to the database
3. ✅ User can add books to their collection
4. ✅ User can view all owned books
5. ✅ User can set reading status (all 4 statuses work)
6. ✅ User can set start and finish dates
7. ✅ User can filter and search their collection
8. ✅ User can perform bulk operations (remove, edit) on multiple books
9. ✅ All data persists across sessions
10. ✅ Application works offline (if local storage used)

---

## 10. Testing Requirements

### 10.1 User Acceptance Testing
- Test all user flows end-to-end
- Verify data persistence
- Test edge cases (duplicate books, invalid dates, etc.)
- Verify UI matches design requirements

### 10.2 Functional Testing
- All CRUD operations work correctly
- Status changes update correctly
- Date validation works
- Search and filter functionality
- Data integrity checks

---

## 11. Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- Set up project structure
- Database schema and models
- Basic routing/navigation
- User profile creation

### Phase 2: Book Management (Week 2)
- Add books to database
- Book list view
- Book detail view
- Search functionality

### Phase 3: User Collection (Week 3)
- Add books to user collection
- Owned books view
- Book cards with all information
- Remove books from collection (single)
- Bulk operations (selection mode, bulk remove, bulk edit)

### Phase 4: Status & Dates (Week 4)
- Reading status management
- Date pickers and validation
- Status filtering
- Progress tracking

### Phase 5: Polish & Testing (Week 5)
- UI/UX refinements
- Filter and sort functionality
- Error handling
- User testing and bug fixes

---

## 12. TODO / Future Implementation Notes

### 12.1 ISBN/ASIN Format Validation
- Add validation for ISBN (10 or 13 digits) and ASIN (10 alphanumeric characters)
- Define validation error messages
- Add validation to book entry form
- Display clear error messages when invalid ISBN/ASIN is entered
- Note: Full format validation (checksum, etc.) to be implemented in future

### 12.2 Bulk Edit Business Rules
- Specify detailed business rules for bulk edit operations:
  - Reading count increment behavior
  - Date auto-population rules
  - State transition pop-ups handling
  - What happens when bulk editing multiple books with different current statuses
  - Partial success scenarios (some books fail validation)

### 12.3 State Transition Pop-ups
- Specify detailed pop-up behavior for state transitions:
  - "Read → To Read" transition pop-up content and options
  - "Read → Currently Reading" transition pop-up content and options
  - Button options and user actions
  - What happens when user clicks "No, it wasn't read" vs "Yes, it was read"
  - Cancel transition option

---

## 13. Appendix

### 13.1 Glossary
- **Book Database:** Central repository of all books in the system
- **User Collection:** Books that belong to a specific user
- **Reading Status:** Current state of a book in user's collection
- **Owned Books:** Books in user's personal collection
- **Explore Page:** Page that searches full database while response has highlighted owned books by user
- **Owned Books Page:** Page that searches only books owned by user
- **Navigation Search:** Search that searches full database while response has highlighted owned books by user (same as Explore page)

### 13.2 References
- StoryGraph: https://app.thestorygraph.com/ (design inspiration only)

**Note:** This application is not affiliated with, endorsed by, or a copy of StoryGraph. It is an independent project inspired by StoryGraph's design and functionality.
- Screenshot reference: Owned Books interface

---

**Document Status:** Ready for Review  
**Next Steps:** Technical design review, UI mockups, development kickoff

