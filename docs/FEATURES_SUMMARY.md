# Features Summary - Quick Reference

**Disclaimer:** This application is **not a copy** of the StoryGraph application. It is an independent project **inspired by** StoryGraph's design and functionality. Any similarities in design or features are for inspiration purposes only, and this application is developed as a local MVP for testing and automation purposes.

## Core MVP Features

### ✅ 1. User Profile Management
- Create user profile (username: 3-50 chars, alphanumeric + underscore/hyphen; display name, email: valid format)
- View and edit profile
- Username and email validation with clear error messages
- Profile persists across sessions

### ✅ 2. Book Database
- Add books to central database
- Required fields: Title, Author
- Optional fields: ISBN (10 or 13 digits), ASIN (10 alphanumeric), Year, Pages, Format, Genres, Cover, Description, Series
- View all books in database (Explore page)
- Search books by title/author/ISBN/ASIN/series name/series author
- Three search types:
  - Explore page: searches full DB, highlights owned books
  - My Books page: searches only books owned by user
  - Navigation search: searches full DB, highlights owned books (same as Explore)
- Duplicate detection (by title+author combination only - other parameters can vary)
- Series support: series name, author, books belong to ONE series (1 book cannot be in more than 1 series)
- Book format: if book has multiple formats, save as separate entries in database
- Genres: free-form text, displayed as tags, max 20 genres per book, max 255 chars per genre, saved to separate table for re-use
- Cover image: valid HTTP/HTTPS URL (if fails to load, show title and author; users cannot upload local images)
- Description: max 5000 characters (error message if exceeded)

### ✅ 3. User Book Collection
- Add books from database to personal collection
- View "My Books" page
- Book cards show: cover, title, author, status, dates, progress, genres, series info (highlighted with "series" tag and series name detail)
- Remove books from collection (single or bulk)
- Edit UserBook metadata (status, dates, progress) only; cannot edit shared Book records
- Bulk operations:
  - Select multiple books (checkboxes)
  - Bulk remove multiple books from collection
  - Bulk edit metadata (status, dates, progress) for multiple books
- Book count display shown contextually where useful:
  - My Books page: "9 books" (total owned books)
  - Explore page: total number of books in database
  - Search result page: "Found 3/300 books" (results vs total database)
  - Home page: total number of books in database
  - Book detail page: number of books in series (if book is in a series)
- Series count display: number of series user owns, displayed in My Books next to total number of owned books (a series can have multiple books, but 1 book cannot be in more than 1 series)

### ✅ 4. Reading Status
Four statuses available:
- **To Read** - Books user wants to read (default when added, progress = 0)
- **Currently Reading** - Books actively being read
- **Read** - Books finished reading (progress auto-set to 100%, reading_count tracked)
- **Didn't Finish** - Books started but not completed (can have finished date = date when user decided to close the book)

**State Transitions:**
- New book → "To Read" (progress = 0)
- "To Read" → "Read": progress = 100%, user confirms via pop-up, reading_count increments (logged in reading_count_logs table)
- "Read" → "To Read"/"Currently Reading": pop-up asks "Are you starting a new reading session?" with "Yes" and "Cancel" options. If "Yes": preserves original dates/progress, allows new input. If "Cancel": no changes.
- "Currently Reading" → "Read": progress = 100%, user confirms via pop-up, reading_count increments (logged in reading_count_logs table)
- Progress field: required, default 0 when book added, automatically 100 when status is "read"

**Reading Count:**
- Stored in separate reading_count_logs table for tracking user and book/series reading history
- Displayed to user is real-time counted based on inputs in reading_count_logs table
- User can see reading_count as detail of book and/or series
- User can re-read book many times
- When book is added, reading_count = 0
- For each read status change to read, user must confirm via pop-up

### ✅ 5. Date Management
- Set start date (when reading began)
- Set finish date (when reading completed)
- Edit dates
- Date validation: dates cannot be in the future (only past or today)
- Date validation: finish >= start (error message: "Start date must be prior to finish date")
- Date validation: started date can be before book was added to collection (valid scenario, no error)
- Date validation: finished date can be set without started date (valid scenario, no error)
- "Didn't Finish" status can have finished date (equals date when user decided to close the book; can be changed when moving to other statuses)
- Dates displayed on book cards

### ✅ 6. Filtering & Organization
- Filter by reading status
- Filter by genre (optional)
- Filter by author (optional)
- Filter by format (optional)
- Filter by ISBN (optional, advanced)
- Filter by ASIN (optional, advanced)
- Sort by: Latest added, Title, Author, Year, Date started, Date finished
- Search within My Books (searches only books owned by user)
- Explore page search (searches full database, highlights owned books)
- Navigation search (searches full database, highlights owned books - same as Explore)
- Search results highlight books in series with "series" tag and show series name detail
- Combine filters and search

## UI/UX Features

- Clean, minimalist, modern design (StoryGraph-inspired)
- Purple/Lavender accent color (#b189e8)
- Card-based book layout
- Collapsible filter section
- Search bar
- Sort dropdown
- Status badges
- Progress bars
- Responsive design

## Data Storage

- **Users Table**: Profile information (single user per instance in MVP)
- **Books Table**: Central book database (books belong to ONE series via seriesId foreign key)
- **UserBooks Table**: User's collection with status/metadata
- **Series Table**: Book series information
- **Genres Table**: Genre names (separate table for re-use)
- **BookGenres Table**: Junction table linking books to genres
- **ReadingCountLogs Table**: Tracks reading history for user and book/series

## Technical Stack (Recommended)

- Frontend: React/Vue/TypeScript
- Database: SQLite (local, file-based)
- Storage: Local-first, offline-capable application
- Architecture: Client-side only, no backend server required

## Out of Scope (Future)

- Social features
- Reviews and ratings (out of scope for MVP)
- Reading challenges
- Statistics/analytics
- Book recommendations
- Import from external sources
- Mobile app
- Multi-user support (single user per instance in MVP)
- Reading notes and annotations (out of scope; notes field removed)

## Success Criteria

✅ User can create profile  
✅ User can add books to database  
✅ User can add books to collection  
✅ User can view My Books  
✅ User can set all 4 reading statuses  
✅ User can set start/finish dates  
✅ User can filter and search  
✅ Data persists across sessions
✅ User can manage series (create, edit, delete, add/remove books)
✅ User can track reading count and re-read books
✅ All validation errors show clear messages  

---

**For detailed information, see:**
- `PRD.md` - Full product requirements
- `USER_STORIES.md` - Detailed user stories
- `DATA_MODELS.md` - Data structure and schema

