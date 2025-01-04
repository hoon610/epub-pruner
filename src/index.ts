import * as fs from 'fs/promises';
import * as path from 'path';
import { INPUT_DIR, OUTPUT_DIR } from './config/constants';
import { validateEpubPath } from './utils/validation';
import { initializeEpub } from './services/epub-initializer';
import { processChaptersInBatches } from './services/chapter-processor';
import { writeFiles } from './services/file-writer';
import type { ProcessingProgress } from './types/interfaces';

export const extractChapters = async (
  epubPath: string,
  outputDir: string,
  onProgress?: (progress: ProcessingProgress) => void,
): Promise<void> => {
  try {
    const epub = await initializeEpub(epubPath);
    const chapters = await processChaptersInBatches(epub, 3, onProgress);
    await writeFiles(epub, chapters, outputDir);

    // eslint-disable-next-line no-console
    console.log('Book processing complete!');
    // eslint-disable-next-line no-console
    console.log(`Total chapters: ${chapters.length}`);
    // eslint-disable-next-line no-console
    console.log(`Total words: ${chapters.reduce((sum, ch) => sum + ch.wordCount, 0)}`);
    // eslint-disable-next-line no-console
    console.log(`Total images: ${chapters.reduce((sum, ch) => sum + ch.images.length, 0)}`);
    // eslint-disable-next-line no-console
    console.log(`Output directory: ${outputDir}`);
  } catch (error) {
    throw new Error(`Failed to extract chapters: ${(error as Error).message}`);
  }
};

export const processEpub = async (
  onProgress?: (progress: ProcessingProgress) => void,
): Promise<void> => {
  try {
    const files = await fs.readdir(INPUT_DIR);
    if (files.length === 0) {
      throw new Error('No files found in input directory');
    }

    const epubFile = files.find((file) => file.toLowerCase().endsWith('.epub'));
    if (!epubFile) {
      throw new Error('No EPUB files found in input directory');
    }

    const epubPath = path.join(INPUT_DIR, epubFile);
    if (!await validateEpubPath(epubPath)) {
      throw new Error('Invalid EPUB file');
    }

    // eslint-disable-next-line no-console
    console.log(`Processing EPUB file: ${epubFile}`);
    await extractChapters(epubPath, OUTPUT_DIR, onProgress);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error processing EPUB:', error);
    throw error;
  }
};

// CLI usage
if (require.main === module) {
  void processEpub((progress) => {
    // eslint-disable-next-line no-console
    console.log(
      `Processing ${progress.chapterTitle} (${progress.currentChapter}/${progress.totalChapters}) - ${progress.status}`,
    );
  })
  // eslint-disable-next-line no-console
    .then(() => console.log('Processing complete!'))
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Error during processing:', error);
      process.exit(1);
    });
}

export * from './types/interfaces';
