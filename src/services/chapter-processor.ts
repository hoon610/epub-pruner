import { JSDOM } from 'jsdom';
import sanitizeFilename from 'sanitize-filename';
import type {
  EPubInterface,
  EPubChapter,
  ChapterInfo,
  ProcessingProgress,
} from '../types/interfaces';
import { validateChapterContent } from '../utils/validation';
import { extractImages } from './image-extractor';

export const processChapter = async (
  epub: EPubInterface,
  chapter: EPubChapter,
  position: number,
  onProgress?: (progress: ProcessingProgress) => void,
): Promise<ChapterInfo> => {
  const [content, rawContent] = await Promise.all([
    new Promise<string>((resolve, reject) => {
      epub.getChapter(chapter.id, (err: Error | null, text?: string) => {
        if (err) reject(new Error(`Failed to get chapter content: ${err.message}`));
        else if (!text || !validateChapterContent(text)) {
          reject(new Error(`Invalid chapter content for ${chapter.title}`));
        } else resolve(text);
      });
    }),
    new Promise<string>((resolve, reject) => {
      epub.getChapterRaw(chapter.id, (err: Error | null, text?: string) => {
        if (err) reject(new Error(`Failed to get raw chapter content: ${err.message}`));
        else if (!text) reject(new Error(`Missing raw content for ${chapter.title}`));
        else resolve(text);
      });
    }),
  ]);

  const dom = new JSDOM(content);
  const textContent = dom.window.document.body.textContent || '';
  const words = textContent.trim().split(/\s+/).filter((w) => w.length > 0);
  const paragraphs = content.match(/<p[^>]*>.*?<\/p>/gs) || [];

  onProgress?.({
    currentChapter: position,
    totalChapters: epub.flow.length,
    chapterTitle: chapter.title || 'Untitled',
    status: 'extracting-images',
  });

  const images = await extractImages(epub, content, chapter.title || 'untitled');

  return {
    id: chapter.id,
    title: chapter.title || `Chapter ${position}`,
    content: textContent,
    rawContent,
    wordCount: words.length,
    charCount: textContent.length,
    paragraphCount: paragraphs.length,
    position,
    fileName: sanitizeFilename(`chapter_${position.toString().padStart(3, '0')}_${chapter.title || 'untitled'}.txt`),
    images,
  };
};

export const processChaptersInBatches = async (
  epub: EPubInterface,
  batchSize: number = 3,
  onProgress?: (progress: ProcessingProgress) => void,
): Promise<ChapterInfo[]> => {
  const results: ChapterInfo[] = [];

  for (let i = 0; i < epub.flow.length; i += batchSize) {
    const batch = epub.flow.slice(i, i + batchSize);
    const batchPromises = batch.map((chapter, idx) => processChapter(epub, chapter, i + idx + 1, onProgress));
    // eslint-disable-next-line no-await-in-loop
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results.sort((a, b) => a.position - b.position);
};
