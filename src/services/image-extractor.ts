import { JSDOM } from 'jsdom';
import sanitizeFilename from 'sanitize-filename';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IMAGES_DIR } from '../config/constants';
import type { EPubInterface, ImageInfo } from '../types/interfaces';

export const extractImages = async (
  epub: EPubInterface,
  content: string,
  chapterTitle: string,
): Promise<ImageInfo[]> => {
  const dom = new JSDOM(content);
  const images = Array.from(dom.window.document.querySelectorAll('img'));
  const imageInfos: ImageInfo[] = [];

  for (const img of images) {
    const imgId = img.getAttribute('id');
    if (imgId) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const imgData = await new Promise<{ data: Buffer; mimeType: string }>((resolve, reject) => {
          epub.getImage(imgId, (err, data, mimeType) => {
            if (err) reject(err);
            else if (data && mimeType) resolve({ data, mimeType });
            else reject(new Error('Missing image data or mime type'));
          });
        });

        const ext = imgData.mimeType.split('/')[1] || 'bin';
        const fileName = sanitizeFilename(`${imgId}_${chapterTitle}.${ext}`);
        const imagePath = path.join(IMAGES_DIR, fileName);

        // eslint-disable-next-line no-await-in-loop
        await fs.writeFile(imagePath, imgData.data);

        imageInfos.push({
          id: imgId,
          fileName,
          mimeType: imgData.mimeType,
          size: imgData.data.length,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Failed to extract image ${imgId} from chapter ${chapterTitle}:`, error);
      }
    }
  }

  return imageInfos;
};
