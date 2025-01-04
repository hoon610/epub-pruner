import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  ChapterInfo,
  ChapterMetadata,
  BookMetadata,
  EPubInterface,
} from '../types/interfaces';
import { IMAGES_DIR } from '../config/constants';

export const writeFiles = async (
  epub: EPubInterface,
  chapters: ChapterInfo[],
  outputDir: string,
): Promise<void> => {
  // Create output directories
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(IMAGES_DIR, { recursive: true });

  // Write TOC
  await fs.writeFile(
    path.join(outputDir, 'toc.json'),
    JSON.stringify(epub.toc, null, 2),
  );

  // Write chapter files and metadata
  for (const chapter of chapters) {
    const chapterPath = path.join(outputDir, chapter.fileName);
    const metadataPath = path.join(outputDir, `${chapter.fileName}.meta.json`);

    const metadata: ChapterMetadata = {
      id: chapter.id,
      title: chapter.title,
      wordCount: chapter.wordCount,
      charCount: chapter.charCount,
      paragraphCount: chapter.paragraphCount,
      position: chapter.position,
      fileName: chapter.fileName,
      extractedDate: new Date().toISOString(),
      images: chapter.images,
    };

    // eslint-disable-next-line no-await-in-loop
    await Promise.all([
      fs.writeFile(chapterPath, chapter.content),
      fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2)),
    ]);
  }

  // Write book metadata
  const bookMetadata: BookMetadata = {
    title: epub.metadata.title,
    author: epub.metadata.creator,
    language: epub.metadata.language,
    subject: epub.metadata.subject,
    date: epub.metadata.date,
    description: epub.metadata.description,
    chapterCount: chapters.length,
    totalWords: chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0),
    totalChars: chapters.reduce((sum, chapter) => sum + chapter.charCount, 0),
    totalImages: chapters.reduce((sum, chapter) => sum + chapter.images.length, 0),
    chapters: chapters.map((ch) => ({
      title: ch.title,
      fileName: ch.fileName,
      position: ch.position,
      imageCount: ch.images.length,
    })),
  };

  await fs.writeFile(
    path.join(outputDir, 'book_metadata.json'),
    JSON.stringify(bookMetadata, null, 2),
  );
};
