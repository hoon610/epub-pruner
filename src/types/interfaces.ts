export interface EPubMetadata {
  creator: string;
  creatorFileAs: string;
  title: string;
  language: string;
  subject: string;
  date: string;
  description: string;
}

export interface EPubChapter {
  id: string;
  title?: string;
  href?: string;
}

export interface EPubTocElement {
  level: number;
  order: number;
  title: string;
  href: string;
}

export type EPubCallback<T> = (err: Error | null, data?: T, mimeType?: string) => void;

export interface EPubInterface {
  metadata: EPubMetadata;
  flow: EPubChapter[];
  toc: EPubTocElement[];
  parse(callback: (err?: Error) => void): void;
  getChapter(chapterId: string, callback: EPubCallback<string>): void;
  getChapterRaw(chapterId: string, callback: EPubCallback<string>): void;
  getImage(imageId: string, callback: EPubCallback<Buffer>): void;
  getFile(fileId: string, callback: EPubCallback<Buffer>): void;
  on(event: 'end' | 'error', callback: (error?: Error) => void): void;
}

export interface ChapterInfo {
  id: string;
  title: string;
  content: string;
  rawContent: string;
  wordCount: number;
  charCount: number;
  paragraphCount: number;
  position: number;
  fileName: string;
  images: ImageInfo[];
}

export interface ImageInfo {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface ChapterMetadata {
  id: string;
  title: string;
  wordCount: number;
  charCount: number;
  paragraphCount: number;
  position: number;
  fileName: string;
  extractedDate: string;
  images: ImageInfo[];
}

export interface ProcessingProgress {
  currentChapter: number;
  totalChapters: number;
  chapterTitle: string;
  status: 'processing' | 'extracting-images' | 'writing-files';
}

export interface BookMetadata {
  title: string;
  author: string;
  language: string;
  subject: string;
  date: string;
  description: string;
  chapterCount: number;
  totalWords: number;
  totalChars: number;
  totalImages: number;
  chapters: Array<{
    title: string;
    fileName: string;
    position: number;
    imageCount: number;
  }>;
}
