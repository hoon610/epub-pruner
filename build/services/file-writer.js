"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeFiles = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const constants_1 = require("../config/constants");
const writeFiles = async (epub, chapters, outputDir) => {
    // Create output directories
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(constants_1.IMAGES_DIR, { recursive: true });
    // Write TOC
    await fs.writeFile(path.join(outputDir, 'toc.json'), JSON.stringify(epub.toc, null, 2));
    // Write chapter files and metadata
    for (const chapter of chapters) {
        const chapterPath = path.join(outputDir, chapter.fileName);
        const metadataPath = path.join(outputDir, `${chapter.fileName}.meta.json`);
        const metadata = {
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
    const bookMetadata = {
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
    await fs.writeFile(path.join(outputDir, 'book_metadata.json'), JSON.stringify(bookMetadata, null, 2));
};
exports.writeFiles = writeFiles;
//# sourceMappingURL=file-writer.js.map