declare module 'epub' {
  import { EventEmitter } from 'events';

  export interface EPub extends EventEmitter {
    metadata: {
      creator: string;
      creatorFileAs: string;
      title: string;
      language: string;
      subject: string;
      date: string;
      description: string;
    };
    flow: Array<{
      id: string;
      title?: string;
      href?: string;
    }>;
    toc: Array<{
      level: number;
      order: number;
      title: string;
      href: string;
    }>;

    parse(): void;
    getChapter(chapterId: string, callback: (err: Error | null, text?: string) => void): void;
    getChapterRaw(chapterId: string, callback: (err: Error | null, text?: string) => void): void;
    getImage(imageId: string, callback: (err: Error | null, data?: Buffer, mimeType?: string) => void): void;
    getFile(fileId: string, callback: (err: Error | null, data?: Buffer, mimeType?: string) => void): void;
  }

  const EPub: {
    new (epubPath: string, imageWebRoot: string, chapterWebRoot: string): EPub;
  };

  // eslint-disable-next-line import/no-default-export
  export default EPub;
}
