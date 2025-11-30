# User Stories

## Epic 1: User Profile Management

### US-1.1: Create User Profile
**As a** new user  
**I want to** create a profile with my information  
**So that** I can start using the application to manage my books

**Acceptance Criteria:**
- User can enter username (required, unique, 3-50 characters, alphanumeric + underscore/hyphen)
- User can enter display name (optional)
- User can enter email (optional, valid email format if provided)
- Profile is saved to database
- User is redirected to main application after profile creation
- Profile persists across sessions
- Validation prevents invalid username format
- Validation prevents invalid email format

**Priority:** P0

---

### US-1.2: View User Profile
**As a** user  
**I want to** view my profile information  
**So that** I can see my account details

**Acceptance Criteria:**
- User can navigate to profile page
- Profile information is displayed
- Profile shows creation date
- Book count display shows total books in collection (real-time) - useful context for profile
- Series count display shows total series user has books from (real-time) - useful context for profile

**Priority:** P0

---

### US-1.3: Edit User Profile
**As a** user  
**I want to** edit my profile information  
**So that** I can keep my information up to date

**Acceptance Criteria:**
- User can access edit mode from profile page
- User can modify display name and email
- Username cannot be changed (or requires special process)
- Changes are saved and reflected immediately
- Validation prevents invalid data (email format validation)
- Error messages are clear and user-friendly

**Priority:** P1

---

## Epic 2: Book Database Management

### US-2.1: Add Book to Database
**As a** user  
**I want to** add a new book to the database  
**So that** I can build the book catalog

**Acceptance Criteria:**
- User can access "Add Book" page/form
- User can enter book title (required)
- User can enter author name (required)
- User can enter optional fields (ISBN, ASIN, year, pages, format, genres, cover, description, series)
- ISBN validation: must be 10 or 13 digits (basic validation)
- ASIN validation: must be 10 alphanumeric characters (basic validation)
- Genres: free-form text, displayed as tags, max 20 genres per book, max 255 characters per genre, saved to separate table for re-use
- Cover image URL: valid HTTP/HTTPS URL (if image fails to load, show book title and author name in a field; users cannot upload local images, only URLs)
- Description: max 5000 characters (if more characters added, show error message)
- Format: if book has multiple formats, save as separate entries in database
- System checks for duplicates before saving
- User receives confirmation when book is saved
- Book appears in book database list
- Note: Book count not displayed on add book page (not useful context)

**Priority:** P0

---

### US-2.2: View All Books in Database
**As a** user  
**I want to** see all books in the database  
**So that** I can browse available books

**Acceptance Criteria:**
- User can navigate to "Explore" page
- Books are displayed in a list or grid
- Each book shows title, author, and cover (if available)
- Books in series are highlighted with "series" tag and show series name detail
- Books owned by user are highlighted with "owned" tag
- If search/filter applied, contextual count shown: "Found X/Y books" (results vs total database count)
- Book count display shows total number of books in database
- User can click on a book to see details
- List is paginated or scrollable for large datasets

**Priority:** P0

---

### US-2.3: Search Books in Database
**As a** user  
**I want to** search for books in the database  
**So that** I can quickly find specific books

**Acceptance Criteria:**
- Search bar is available on Explore page and navigation bar
- User can search by title
- User can search by author
- User can search by ISBN
- User can search by ASIN
- User can search by series name
- User can search by series author
- Search results update as user types (optional) or on submit
- Search is case-insensitive
- Search results show contextual count: "Found 3/300 books" (results count vs total database count)
- Search results highlight books the user owns with an "owned" tag (Explore page and navigation search)
- Search results highlight books in series with a "series" tag and show series name detail
- No results message is shown when no matches found

**Priority:** P0

---

### US-2.4: View Book Details
**As a** user  
**I want to** see detailed information about a book  
**So that** I can decide if I want to add it to my collection

**Acceptance Criteria:**
- User can click on a book to see full details
- All book information is displayed
- Cover image is shown (if available)
- If book is part of a series, series information is displayed with "series" tag and series name
- Series count display shows number of books in the series (if book is in a series) - useful context
- Book can only be in one series (1 book cannot be in more than 1 series)
- "Add to My Books" button is visible
- User can navigate back to book list
- Note: Total database/owned book counts not displayed here (not useful context for single book view)

**Priority:** P0

---

## Epic 3: User Book Collection

### US-3.1: Add Book to My Collection
**As a** user  
**I want to** add a book from the database to my collection  
**So that** I can track it in my owned books

**Acceptance Criteria:**
- User can select a book from database
- User can click "Add to My Books" button
- System prevents adding duplicate books to collection
- Book is added with default status "To Read"
- User receives confirmation message
- Book appears in "My Books" view

**Priority:** P0

---

### US-3.2: View My Books
**As a** user  
**I want to** see all books in my collection  
**So that** I can manage my library

**Acceptance Criteria:**
- User can navigate to "My Books" page
- All books in collection are displayed
- Each book shows cover, title, author, status, and dates
- Books in series are highlighted with "series" tag and show series name detail
- Book count is displayed (e.g., "9 books") - total owned books, useful context for this page
- Series count is displayed (e.g., "3 series") - total series user has books from, useful context
- When filters/search applied, show contextual count: "Showing 5 of 9 owned books" (filtered vs total)
- Books are displayed in cards or list format
- Layout matches StoryGraph-inspired design

**Priority:** P0

---

### US-3.3: Remove Book from Collection
**As a** user  
**I want to** remove a book from my collection  
**So that** I can keep my collection accurate

**Acceptance Criteria:**
- User can access remove/delete option from book card or detail page
- Confirmation dialog appears before removal
- Book is removed from user's collection
- Book remains in database (not deleted)
- User receives confirmation message
- Book no longer appears in owned books list
- Book count updates in real-time after removal

**Priority:** P0

---

### US-3.4: Edit UserBook Metadata
**As a** user  
**I want to** edit metadata for books in my collection  
**So that** I can update status, dates, and progress

**Acceptance Criteria:**
- User can edit UserBook metadata (status, dates, progress) from book detail page
- User cannot edit shared Book records (title, author, ISBN, etc.)
- If book details need updating, user must create a new book entry
- Changes are saved immediately
- UI updates to reflect changes

**Priority:** P0

---

### US-3.5: Select Multiple Books for Bulk Operations
**As a** user  
**I want to** select multiple books in my collection  
**So that** I can perform bulk operations on them

**Acceptance Criteria:**
- User can enable selection mode on "Owned Books" page
- Checkbox appears on each book card when in selection mode
- User can select individual books by clicking checkbox
- User can select all visible books with "Select All" option
- User can deselect all books with "Clear Selection" option
- Selected books are visually highlighted
- Bulk action toolbar appears showing count: "X books selected"
- User can exit selection mode
- Selection persists when applying filters/search (selected books remain selected if visible)

**Priority:** P1

---

### US-3.6: Bulk Remove Books from Collection
**As a** user  
**I want to** remove multiple books from my collection at once  
**So that** I can efficiently manage my collection

**Acceptance Criteria:**
- User can select multiple books using checkboxes
- "Bulk Remove" button appears in bulk action toolbar when books are selected
- User clicks "Bulk Remove" button
- Confirmation dialog appears showing:
  - List of books to be removed (or count if many)
  - Total count: "Remove 5 books from collection?"
  - Warning message
- User can confirm or cancel the operation
- Upon confirmation, all selected books are removed from collection
- Books remain in database (not deleted)
- User receives confirmation message: "5 books removed from collection"
- Book count updates in real-time
- Selection is cleared after operation

**Priority:** P1

---

### US-3.7: Bulk Edit Book Metadata
**As a** user  
**I want to** edit metadata for multiple books at once  
**So that** I can efficiently update status, dates, or progress for multiple books

**Acceptance Criteria:**
- User can select multiple books using checkboxes
- "Bulk Edit" button appears in bulk action toolbar when books are selected
- User clicks "Bulk Edit" button
- Bulk edit modal/dialog appears showing:
  - Count of selected books: "Editing 5 books"
  - Form with editable fields:
    - Reading status (dropdown)
    - Start date (date picker)
    - Finish date (date picker)
    - Progress (0-100 slider or input)
  - Option to "Apply to all selected books" or "Customize per book"
  - Preview of changes before applying
- User can set values for all selected books at once
- User can preview changes before applying
- User clicks "Apply Changes" button
- Confirmation dialog appears: "Apply these changes to 5 books?"
- Upon confirmation, changes are applied to all selected books
- User receives confirmation message: "Updated 5 books"
- UI updates to reflect changes
- Selection is cleared after operation
- Business rules apply (e.g., if status set to "Read", progress auto-updates to 100%)
- Note: Detailed business rules for bulk edit (reading count increment, date auto-population, state transition pop-ups, partial success scenarios) to be specified in TODO section

**Priority:** P1

---

## Epic 4: Reading Status Management

### US-4.1: Set Book Status to "To Read"
**As a** user  
**I want to** mark a book as "To Read"  
**So that** I can track books I plan to read

**Acceptance Criteria:**
- User can select "To Read" status from dropdown
- Status is saved immediately
- Book card updates to show "To Read" status
- Book appears in "To Read" filter results
- No dates are required for this status

**Priority:** P0

---

### US-4.2: Set Book Status to "Currently Reading"
**As a** user  
**I want to** mark a book as "Currently Reading"  
**So that** I can track what I'm actively reading

**Acceptance Criteria:**
- User can select "Currently Reading" status
- User can optionally set a start date
- If no date provided, current date is used
- Status is saved immediately
- Progress can be tracked (0-100%)
- Book appears in "Currently Reading" filter
- Progress bar is displayed on book card

**Priority:** P0

---

### US-4.3: Set Book Status to "Read"
**As a** user  
**I want to** mark a book as "Read"  
**So that** I can track books I've finished

**Acceptance Criteria:**
- User can select "Read" status
- User can set a finish date
- If no date provided, current date is used
- Status is saved immediately
- Book appears in "Read" filter
- Finished date is displayed on book card
- Progress automatically set to 100%
- If user manually sets progress to 50% and then changes status to "Read", progress is automatically updated to 100%
- If changing from "To Read" to "Read": progress set to 100%, user must confirm via pop-up, reading_count increments (logged in reading_count_logs table)
- If changing from "Currently Reading" to "Read": if 1st time, progress set to 100%, user must confirm via pop-up, reading_count = 1 (logged in reading_count_logs table). If nth time, progress set to 100%, user must confirm via pop-up, reading_count increments (new entry logged in reading_count_logs table)
- Reading count is stored in separate reading_count_logs table for tracking user and book/series reading history
- Reading count displayed to user is real-time counted based on inputs in the reading_count_logs table
- User can see reading_count as a detail of the book and/or series
- User can re-read the book many times
- When book is added, the reading_count = 0

**Priority:** P0

---

### US-4.4: Set Book Status to "Didn't Finish"
**As a** user  
**I want to** mark a book as "Didn't Finish"  
**So that** I can track books I started but didn't complete

**Acceptance Criteria:**
- User can select "Didn't Finish" status
- User can optionally set a start date (when they started)
- User can optionally set a finished date (equals the date when user decided to close the book as didn't-finish and will not read anymore)
- Finished date can be changed in the future when moving to other statuses
- Status is saved immediately
- Book appears in "Didn't Finish" filter
- Status is clearly displayed on book card

**Priority:** P0

---

### US-4.5: Change Book Status
**As a** user  
**I want to** change a book's reading status  
**So that** I can update my reading progress

**Acceptance Criteria:**
- User can change status at any time
- Status dropdown is accessible from book card or detail page
- Previous status is replaced (not tracked in MVP)
- **State Transitions:**
  - **New book added** → Default status "To Read"
  - **"To Read" → "Read"** → Progress set to 100%, reading_count = 1
  - **"Read" → "To Read"** → Pop-up appears asking "Are you starting a new reading session?" with "Yes" and "Cancel" options. If "Yes": original reading history remains visible, user can set new dates/progress, status changes. If "Cancel": status remains "Read", no changes.
  - **"Read" → "Currently Reading"** → Pop-up appears asking "Are you starting a new reading session?" with "Yes" and "Cancel" options. If "Yes": original reading history remains visible, user can set new dates/progress, status changes. If "Cancel": status remains "Read", no changes.
  - **"Currently Reading" → "Read"** → If 1st time: progress set to 100%, reading_count = 1. If nth time: progress set to 100%, reading_count = previous + 1
- Status change is saved immediately
- UI updates to reflect new status

**Priority:** P0

---

## Epic 5: Date Management

### US-5.1: Set Start Date
**As a** user  
**I want to** record when I started reading a book  
**So that** I can track my reading timeline

**Acceptance Criteria:**
- User can set start date when status is "Currently Reading"
- Date picker is user-friendly
- Date can be set manually or auto-populated
- Date is displayed on book card as "Started [Date]"
- Date can be edited later
- Date validation: started date cannot be in the future (only past or today)
- Date validation: started date can be before book was added to collection (valid scenario, no error)

**Priority:** P0

---

### US-5.2: Set Finish Date
**As a** user  
**I want to** record when I finished reading a book  
**So that** I can track my reading history

**Acceptance Criteria:**
- User can set finish date when status is "Read"
- Date picker is user-friendly
- Date can be set manually or auto-populated
- Date is displayed on book card as "Finished [Date]"
- Date can be edited later
- Finish date must be >= start date (if both exist) - if not, show error message: "Start date must be prior to finish date"
- Date validation: finished date cannot be in the future (only past or today)
- Date validation: started date can be before book was added to collection (valid scenario, no error)
- Date validation: finished date can be set without started date (valid scenario, no error)

**Priority:** P0

---

### US-5.3: Edit Dates
**As a** user  
**I want to** edit start and finish dates  
**So that** I can correct mistakes or update information

**Acceptance Criteria:**
- User can edit dates from book detail page
- Date picker allows selecting new date
- Changes are saved immediately
- Validation ensures finish date >= start date (if not, show error message: "Start date must be prior to finish date")
- Updated dates are reflected on book card
- Date validation: started date can be before book was added to collection (valid scenario, no error)
- Date validation: finished date can be set without started date (valid scenario, no error)

**Priority:** P0

---

## Epic 6: Filtering and Organization

### US-6.1: Filter Books by Status
**As a** user  
**I want to** filter my books by reading status  
**So that** I can see only books in a specific category

**Acceptance Criteria:**
- Filter section is available on "Owned Books" page
- User can select one or more statuses
- Book list updates to show only matching books
- Filter state is preserved (optional)
- User can clear filters to see all books
- Active filters are indicated visually

**Priority:** P0

---

### US-6.2: Filter Books by Genre
**As a** user  
**I want to** filter my books by genre  
**So that** I can find books of a specific type

**Acceptance Criteria:**
- Genre filter is available in filter section
- User can select one or more genres
- Book list updates to show matching books
- Genre tags are displayed on book cards
- User can combine genre filter with other filters

**Priority:** P1

---

### US-6.5: Filter Books by Author
**As a** user  
**I want to** filter my books by author  
**So that** I can see all books by a specific author

**Acceptance Criteria:**
- Author filter is available in filter section
- User can select one or more authors
- Book list updates to show matching books
- User can combine author filter with other filters
- Author name is displayed on book cards

**Priority:** P1

---

### US-6.6: Filter Books by Format
**As a** user  
**I want to** filter my books by format  
**So that** I can see only digital, physical, or audiobook formats

**Acceptance Criteria:**
- Format filter is available in filter section
- User can select one or more formats (digital, physical, audiobook)
- Book list updates to show matching books
- Format is displayed on book cards
- User can combine format filter with other filters

**Priority:** P1

---

### US-6.7: Filter Books by ISBN
**As a** user  
**I want to** filter my books by ISBN  
**So that** I can find books with specific ISBNs

**Acceptance Criteria:**
- ISBN filter is available in filter section (optional, advanced filter)
- User can enter ISBN to filter
- Book list updates to show matching books
- User can combine ISBN filter with other filters

**Priority:** P2

---

### US-6.8: Filter Books by ASIN
**As a** user  
**I want to** filter my books by ASIN  
**So that** I can find books with specific ASINs

**Acceptance Criteria:**
- ASIN filter is available in filter section (optional, advanced filter)
- User can enter ASIN to filter
- Book list updates to show matching books
- User can combine ASIN filter with other filters

**Priority:** P2

---

### US-6.3: Sort Books
**As a** user  
**I want to** sort my books  
**So that** I can organize them how I prefer

**Acceptance Criteria:**
- Sort dropdown is available on "Owned Books" page
- User can sort by:
  - Latest added (default)
  - Title (A-Z)
  - Author (A-Z)
  - Publication year
  - Date started
  - Date finished
- Sort order is applied immediately
- Sort preference is indicated in dropdown

**Priority:** P0

---

### US-6.4: Search My Books
**As a** user  
**I want to** search within my book collection  
**So that** I can quickly find specific books

**Acceptance Criteria:**
- Search bar is available on "Owned Books" page
- Search searches only books owned by user
- User can search by title
- User can search by author
- User can search by series name
- User can search by series author
- Search results update in real-time or on submit
- Search works with filters (combined)
- Search results show contextual count: "Found 3/300 books" (results count vs total database count)
- When filters applied, show: "Showing 5 of 9 owned books" (filtered count vs total owned)
- Series count is displayed (e.g., "3 series") - number of series user owns, displayed next to total number of owned books
- Search results highlight books the user owns with an "owned" tag
- Search results highlight books in series with a "series" tag and show series name detail
- No results message when no matches

**Priority:** P0

---

## Epic 7: Series Management

### US-7.1: Create Series
**As a** user  
**I want to** create a new book series  
**So that** I can organize related books together

**Acceptance Criteria:**
- User can create a series inline when adding a new book (from Add Book page)
- User can toggle "Create new series" checkbox to show series creation form
- User can enter series name (required)
- User can enter series author (required)
- System checks for duplicate series (by name+author combination)
- Series is created automatically when book is submitted
- Series is saved to database before book creation
- User receives error message if series creation fails (e.g., duplicate)
- Newly created series appears in series dropdown for future use
- Series list automatically refreshes after creation

**Priority:** P0

---

### US-7.2: View Series Details
**As a** user  
**I want to** view details about a series  
**So that** I can see all books in the series

**Acceptance Criteria:**
- User can click on a series name to see series details
- Series information is displayed (name, author)
- All books in the series are listed
- Books are displayed in order (if position is set)
- User can see which books in the series they own (highlighted with "owned" tag)
- Series count shows number of books in the series

**Priority:** P0

---

### US-7.3: Edit Series Information
**As a** user  
**I want to** edit series name or author  
**So that** I can correct mistakes or update information

**Acceptance Criteria:**
- User can access edit mode from series detail page
- User can modify series name
- User can modify series author
- Changes are saved and reflected immediately
- All books in the series are updated to reflect changes
- Validation prevents invalid data

**Priority:** P1

---

### US-7.4: Add Book to Series
**As a** user  
**I want to** add a book to a series  
**So that** I can organize books that belong together

**Acceptance Criteria:**
- User can select a book (from database or owned books)
- User can select a series to add the book to
- System prevents adding book to multiple series (1 book can only be in 1 series)
- User can optionally set book position in series
- Book is added to series
- Series information is displayed on book card
- User receives confirmation when book is added to series

**Priority:** P0

---

### US-7.5: Remove Book from Series
**As a** user  
**I want to** remove a book from a series  
**So that** I can correct mistakes or reorganize

**Acceptance Criteria:**
- User can access remove option from book detail page or series detail page
- Confirmation dialog appears before removal
- Book is removed from series
- Book remains in database (not deleted)
- Series information is removed from book card
- User receives confirmation message

**Priority:** P1

---

### US-7.6: View All Books in Series
**As a** user  
**I want to** see all books in a series  
**So that** I can browse the complete series

**Acceptance Criteria:**
- User can navigate to series detail page
- All books in the series are displayed
- Books are displayed in order (if position is set)
- Each book shows cover, title, author
- Books owned by user are highlighted with "owned" tag
- Series count shows total number of books in series

**Priority:** P0

---

### US-7.7: Delete Series
**As a** user  
**I want to** delete a series  
**So that** I can remove series that are no longer needed

**Acceptance Criteria:**
- User can access delete option from series detail page
- Confirmation dialog appears showing:
  - Series name
  - Number of books in series
  - Warning that books will be removed from series (but not deleted from database)
- User can confirm or cancel the operation
- Upon confirmation, series is deleted
- All books in series have seriesId set to NULL
- Books remain in database (not deleted)
- User receives confirmation message

**Priority:** P1

---

### US-7.8: Set Book Position in Series
**As a** user  
**I want to** set the position of a book in a series  
**So that** I can organize books in reading order

**Acceptance Criteria:**
- User can set book position when adding book to series
- User can edit book position from book detail page or series detail page
- Position is a positive integer
- Position is displayed on book card (if set)
- Books in series can be sorted by position

**Priority:** P1

---

## Epic 8: Reading Count & Re-reading

### US-8.1: View Reading Count
**As a** user  
**I want to** see how many times I've read a book or series  
**So that** I can track my re-reading history

**Acceptance Criteria:**
- Reading count is displayed on book detail page
- Reading count is displayed on series detail page (if applicable)
- Reading count shows as "Read X times" or "Not read yet"
- Reading count is real-time calculated from reading_count_logs table
- Reading count is visible for both individual books and series

**Priority:** P0

---

### US-8.2: Re-read a Book
**As a** user  
**I want to** mark a book as read again  
**So that** I can track multiple readings of the same book

**Acceptance Criteria:**
- User can change status from any status to "Read"
- When changing to "Read" status, pop-up appears asking user to confirm book was read
- User must confirm via pop-up for reading count to increment
- Upon confirmation, new entry is added to reading_count_logs table
- Reading count is incremented and displayed
- User can re-read the same book many times
- Each reading is logged with date in reading_count_logs table

**Priority:** P0

---

### US-8.3: Understand Reading Count Increments
**As a** user  
**I want to** understand how reading count works  
**So that** I know when it increments

**Acceptance Criteria:**
- When book is added to collection, reading_count = 0
- Reading count only increments when status changes to "Read" AND user confirms via pop-up
- Reading count is stored in separate reading_count_logs table
- Reading count displayed is real-time counted from reading_count_logs table
- User can see reading history (dates) for book/series

**Priority:** P0

---

## Epic 9: Data Validation & Error Handling

### US-9.1: Handle Invalid ISBN Format
**As a** user  
**I want to** receive clear error messages when entering invalid ISBN  
**So that** I can correct my input

**Acceptance Criteria:**
- When user enters ISBN that is not 10 or 13 digits, error message is displayed
- Error message: "ISBN must be 10 or 13 digits"
- User cannot save book with invalid ISBN
- Error is displayed inline on form

**Priority:** P0

---

### US-9.2: Handle Invalid ASIN Format
**As a** user  
**I want to** receive clear error messages when entering invalid ASIN  
**So that** I can correct my input

**Acceptance Criteria:**
- When user enters ASIN that is not 10 alphanumeric characters, error message is displayed
- Error message: "ASIN must be 10 alphanumeric characters"
- User cannot save book with invalid ASIN
- Error is displayed inline on form

**Priority:** P0

---

### US-9.3: Handle Invalid Email Format
**As a** user  
**I want to** receive clear error messages when entering invalid email  
**So that** I can correct my input

**Acceptance Criteria:**
- When user enters invalid email format, error message is displayed
- Error message: "Please enter a valid email address"
- User cannot save profile with invalid email
- Error is displayed inline on form
- Email validation supports all valid email formats (including subdomains, plus signs, etc.)

**Priority:** P0

---

### US-9.4: Handle Invalid Date Ranges
**As a** user  
**I want to** receive clear error messages when entering invalid date ranges  
**So that** I can correct my input

**Acceptance Criteria:**
- When user sets finished date before started date, error message is displayed
- Error message: "Start date must be prior to finish date"
- User cannot save with invalid date range
- Error is displayed inline on form

**Priority:** P0

---

### US-9.5: Handle Duplicate Book Detection Errors
**As a** user  
**I want to** receive clear error messages when trying to add duplicate books  
**So that** I can understand why the book wasn't added

**Acceptance Criteria:**
- When user tries to add book with same title+author (case-insensitive), error message is displayed
- Error message: "A book with this title and author already exists in the database"
- User can see existing book in database
- User can choose to add existing book to collection instead

**Priority:** P0

---

### US-9.6: Handle Validation Errors with Clear Messages
**As a** user  
**I want to** receive clear error messages for all validation failures  
**So that** I can understand and fix issues

**Acceptance Criteria:**
- All validation errors display clear, user-friendly messages
- Errors are displayed inline on forms
- Errors are specific to the field that failed validation
- User can see what needs to be fixed
- Error messages use plain language (not technical jargon)

**Priority:** P0

---

### US-9.7: Handle Description Length Limit
**As a** user  
**I want to** receive an error message when description exceeds limit  
**So that** I can shorten my description

**Acceptance Criteria:**
- When user enters description longer than 5000 characters, error message is displayed
- Error message: "Description cannot exceed 5000 characters"
- User cannot save book with description exceeding limit
- Character count is displayed as user types
- Error is displayed inline on form

**Priority:** P0

---

### US-9.8: Handle Cover Image Load Failure
**As a** user  
**I want to** see book information even when cover image fails to load  
**So that** I can still identify the book

**Acceptance Criteria:**
- When cover image URL fails to load (404, invalid URL, etc.), fallback is displayed
- Fallback shows book title and author name in a styled field
- User can still see and use the book card
- No error message is shown to user (graceful degradation)

**Priority:** P0

---

## Epic 10: Username Validation

### US-10.1: Validate Username Format
**As a** user  
**I want to** receive clear error messages when entering invalid username  
**So that** I can create a valid username

**Acceptance Criteria:**
- When user enters username shorter than 3 characters, error message is displayed
- When user enters username longer than 50 characters, error message is displayed
- When user enters username with invalid characters (not alphanumeric, underscore, or hyphen), error message is displayed
- Error message: "Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens"
- User cannot save profile with invalid username
- Error is displayed inline on form

**Priority:** P0

---

### US-10.2: Validate Username Uniqueness
**As a** user  
**I want to** receive clear error messages when username is already taken  
**So that** I can choose a different username

**Acceptance Criteria:**
- When user enters username that already exists, error message is displayed
- Error message: "This username is already taken. Please choose another."
- User cannot save profile with duplicate username
- Error is displayed inline on form

**Priority:** P0

---

## Priority Legend
- **P0:** Must have for MVP
- **P1:** Should have (nice to have)
- **P2:** Could have (future)

