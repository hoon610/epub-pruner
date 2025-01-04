import * as fs from 'fs/promises';
import * as path from 'path';

export const validateEpubPath = async (epubPath: string): Promise<boolean> => {
  try {
    const stats = await fs.stat(epubPath);
    return stats.isFile() && path.extname(epubPath).toLowerCase() === '.epub';
  } catch {
    return false;
  }
};

export const validateChapterContent = (content: string): boolean => {
  if (!content?.trim()) return false;
  if (content.length < 10) return false;
  return true;
};
