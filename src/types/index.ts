// Data Models based on DATA_MODELS.md

export enum ReadingStatus {
  TO_READ = 'to-read',
  CURRENTLY_READING = 'currently-reading',
  READ = 'read',
  DIDNT_FINISH = 'didnt-finish'
}

export enum BookFormat {
  DIGITAL = 'digital',
  PHYSICAL = 'physical',
  AUDIOBOOK = 'audiobook'
}

export interface User {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Series {
  id: string;
  name: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  asin?: string;
  seriesId?: string;
  position?: number;
  publicationYear?: number;
  pages?: number;
  format?: BookFormat;
  coverImageUrl?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Genre {
  id: string;
  name: string;
  createdAt: Date;
}

export interface BookGenre {
  id: string;
  bookId: string;
  genreId: string;
}

export interface UserBook {
  id: string;
  userId: string;
  bookId: string;
  status: ReadingStatus;
  startedDate?: Date;
  finishedDate?: Date;
  progress: number;
  addedAt: Date;
  updatedAt: Date;
}

export interface ReadingCountLog {
  id: string;
  userId: string;
  bookId?: string;
  seriesId?: string;
  readDate: Date;
  createdAt: Date;
}

// Extended types for UI
export interface BookWithDetails extends Book {
  genres?: Genre[];
  series?: Series;
  userBook?: UserBook;
  readingCount?: number;
  isOwned?: boolean;
}

export interface SeriesWithDetails extends Series {
  books: Book[];
  readingCount?: number;
}

// Form types
export interface BookFormData {
  title: string;
  author: string;
  isbn?: string;
  asin?: string;
  seriesId?: string;
  position?: number;
  publicationYear?: number;
  pages?: number;
  format?: BookFormat;
  coverImageUrl?: string;
  description?: string;
  genres?: string[];
}

export interface UserFormData {
  username: string;
  displayName?: string;
  email?: string;
}

export interface UserUpdateData {
  displayName?: string;
  email?: string;
}

export interface SeriesFormData {
  name: string;
  author: string;
}

export interface UserBookFormData {
  status: ReadingStatus;
  startedDate?: Date;
  finishedDate?: Date;
  progress: number;
}

// Filter and sort types
export interface BookFilters {
  status?: ReadingStatus[];
  genres?: string[];
  authors?: string[];
  formats?: BookFormat[];
  isbn?: string;
  asin?: string;
}

export type SortOption = 
  | 'latest-added'
  | 'title-az'
  | 'author-az'
  | 'year'
  | 'date-started'
  | 'date-finished';

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

