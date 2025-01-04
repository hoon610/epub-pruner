import EPub from 'epub';
import type { EPubInterface } from '../types/interfaces';

export const initializeEpub = (epubPath: string): Promise<EPubInterface> => {
  const epubInstance = new EPub(epubPath, '/images/', '/chapters/');

  return new Promise((resolve, reject) => {
    epubInstance.on('end', () => {
      resolve(epubInstance);
    });

    epubInstance.on('error', reject);
    epubInstance.parse();
  });
};
