# Data Folder

This folder contains data files for the book-manager application.

## Structure

```
data/
├── jsonExport/
│   └── deduped_books_and_documents.json  # Amazon book export (seed data)
├── export/
│   └── book-manager-db.json              # Exported database backups
└── harFiles/
    └── ...                                # HAR files (not used by app)
```

## Usage

### Export Directory (`export/`)
Store your exported database backups here. These are JSON files containing:
- Users
- Books
- Series
- Genres
- User Books (reading status)
- Reading Count Logs

**To Export:**
```javascript
// In browser console:
await window.dataIO.downloadDatabaseJSON('book-manager-db.json');
// Then move downloaded file to data/export/
```

### JSON Export Directory (`jsonExport/`)
Contains seed data or imported book lists (like Amazon exports).

**To Load:**
```javascript
// In browser console:
const count = await window.dataIO.loadAmazonExport('jsonExport/deduped_books_and_documents.json');
console.log(`Imported ${count} books`);
```

**To Import Example Data:**
```javascript
// In browser console - easiest way (one step):
await window.dataIO.loadAndImportFromDataFolder('export/example-data.json');

// Or load a custom export file:
await window.dataIO.loadAndImportFromDataFolder('export/book-manager-db.json');
```

## Accessing Files

Files in this folder are served as static assets when running the dev server:
- URL: `http://localhost:3000/data/{path}`
- Example: `http://localhost:3000/data/jsonExport/deduped_books_and_documents.json`

**Important:** After adding or modifying files in this folder, you need to sync them to `public/data/`:

```bash
node scripts/sync-data.js
```

## Notes

- Files here are version-controlled (committed to Git) - this is the source of truth
- The `public/data/` folder is a generated copy (not version controlled) used for serving files
- Export files should be manually copied here after downloading
- Use descriptive filenames with dates: `book-manager-2024-11-30.json`

