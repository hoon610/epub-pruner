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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processEpub = exports.extractChapters = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const jsdom_1 = require("jsdom");
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
const EPub = require('epub');
// Constants
const INPUT_DIR = path.join(__dirname, '..', 'input');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');
// Utility functions
const initializeEpub = (epubPath) => {
    const epubInstance = new EPub(epubPath, '/images/', '/chapters/');
    return new Promise((resolve, reject) => {
        epubInstance.on('end', () => {
            resolve(epubInstance);
        });
        epubInstance.on('error', reject);
        epubInstance.parse();
    });
};
const validateEpubPath = async (epubPath) => {
    try {
        const stats = await fs.stat(epubPath);
        return stats.isFile() && path.extname(epubPath).toLowerCase() === '.epub';
    }
    catch {
        return false;
    }
};
const validateChapterContent = (content) => {
    if (!content?.trim())
        return false;
    if (content.length < 10)
        return false;
    return true;
};
const extractImages = async (epub, content, chapterTitle) => {
    const dom = new jsdom_1.JSDOM(content);
    const images = Array.from(dom.window.document.querySelectorAll('img'));
    const imageInfos = [];
    for (const img of images) {
        const imgId = img.getAttribute('id');
        if (imgId) {
            try {
                const imgData = await new Promise((resolve, reject) => {
                    epub.getImage(imgId, (err, data, mimeType) => {
                        if (err)
                            reject(err);
                        else if (data && mimeType)
                            resolve({ data, mimeType });
                        else
                            reject(new Error('Missing image data or mime type'));
                    });
                });
                const ext = imgData.mimeType.split('/')[1] || 'bin';
                const fileName = (0, sanitize_filename_1.default)(`${imgId}_${chapterTitle}.${ext}`);
                const imagePath = path.join(IMAGES_DIR, fileName);
                await fs.writeFile(imagePath, imgData.data);
                imageInfos.push({
                    id: imgId,
                    fileName,
                    mimeType: imgData.mimeType,
                    size: imgData.data.length,
                });
            }
            catch (error) {
                console.warn(`Failed to extract image ${imgId} from chapter ${chapterTitle}:`, error);
            }
        }
    }
    return imageInfos;
};
const processChapter = async (epub, chapter, position, onProgress) => {
    // Get chapter content
    const [content, rawContent] = await Promise.all([
        new Promise((resolve, reject) => {
            epub.getChapter(chapter.id, (err, text) => {
                if (err)
                    reject(new Error(`Failed to get chapter content: ${err.message}`));
                else if (!text || !validateChapterContent(text)) {
                    reject(new Error(`Invalid chapter content for ${chapter.title}`));
                }
                else
                    resolve(text);
            });
        }),
        new Promise((resolve, reject) => {
            epub.getChapterRaw(chapter.id, (err, text) => {
                if (err)
                    reject(new Error(`Failed to get raw chapter content: ${err.message}`));
                else if (!text)
                    reject(new Error(`Missing raw content for ${chapter.title}`));
                else
                    resolve(text);
            });
        }),
    ]);
    // Parse HTML content for metrics
    const dom = new jsdom_1.JSDOM(content);
    const textContent = dom.window.document.body.textContent || '';
    const words = textContent.trim().split(/\s+/).filter((w) => w.length > 0);
    const paragraphs = content.match(/<p[^>]*>.*?<\/p>/gs) || [];
    // Extract images
    onProgress?.({
        currentChapter: position,
        totalChapters: epub.flow.length,
        chapterTitle: chapter.title || 'Untitled',
        status: 'extracting-images',
    });
    const images = await extractImages(epub, content, chapter.title || 'untitled');
    const chapterInfo = {
        id: chapter.id,
        title: chapter.title || `Chapter ${position}`,
        content: textContent,
        rawContent,
        wordCount: words.length,
        charCount: textContent.length,
        paragraphCount: paragraphs.length,
        position,
        fileName: (0, sanitize_filename_1.default)(`chapter_${position.toString().padStart(3, '0')}_${chapter.title || 'untitled'}.txt`),
        images,
    };
    return chapterInfo;
};
const processChaptersInBatches = async (epub, batchSize = 3, onProgress) => {
    const results = [];
    for (let i = 0; i < epub.flow.length; i += batchSize) {
        const batch = epub.flow.slice(i, i + batchSize);
        const batchPromises = batch.map((chapter, idx) => processChapter(epub, chapter, i + idx + 1, onProgress));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
    }
    return results.sort((a, b) => a.position - b.position);
};
const extractChapters = async (epubPath, outputDir, onProgress) => {
    try {
        // Initialize EPUB
        const epub = await initializeEpub(epubPath);
        // Create output directories
        await fs.mkdir(outputDir, { recursive: true });
        await fs.mkdir(IMAGES_DIR, { recursive: true });
        // Extract TOC
        await fs.writeFile(path.join(outputDir, 'toc.json'), JSON.stringify(epub.toc, null, 2));
        // Process chapters in batches
        const chapters = await processChaptersInBatches(epub, 3, onProgress);
        // Write chapter files and metadata
        for (const chapter of chapters) {
            onProgress?.({
                currentChapter: chapter.position,
                totalChapters: chapters.length,
                chapterTitle: chapter.title,
                status: 'writing-files',
            });
            const chapterPath = path.join(outputDir, chapter.fileName);
            const metadataPath = path.join(outputDir, `${chapter.fileName}.meta.json`);
            // Write chapter content
            await fs.writeFile(chapterPath, chapter.content);
            // Write metadata
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
            await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
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
        console.log('Book processing complete!');
        console.log(`Total chapters: ${chapters.length}`);
        console.log(`Total words: ${bookMetadata.totalWords}`);
        console.log(`Total images: ${bookMetadata.totalImages}`);
        console.log(`Output directory: ${outputDir}`);
    }
    catch (error) {
        throw new Error(`Failed to extract chapters: ${error.message}`);
    }
};
exports.extractChapters = extractChapters;
const processEpub = async (onProgress) => {
    try {
        // Read input directory
        const files = await fs.readdir(INPUT_DIR);
        if (files.length === 0) {
            throw new Error('No files found in input directory');
        }
        // Find first EPUB file
        const epubFile = files.find((file) => file.toLowerCase().endsWith('.epub'));
        if (!epubFile) {
            throw new Error('No EPUB files found in input directory');
        }
        const epubPath = path.join(INPUT_DIR, epubFile);
        if (!await validateEpubPath(epubPath)) {
            throw new Error('Invalid EPUB file');
        }
        console.log(`Processing EPUB file: ${epubFile}`);
        await extractChapters(epubPath, OUTPUT_DIR, onProgress);
    }
    catch (error) {
        console.error('Error processing EPUB:', error);
        throw error;
    }
};
exports.processEpub = processEpub;
// CLI usage
if (require.main === module) {
    void processEpub((progress) => {
        console.log(`Processing ${progress.chapterTitle} (${progress.currentChapter}/${progress.totalChapters}) - ${progress.status}`);
    })
        .then(() => console.log('Processing complete!'))
        .catch((error) => {
        console.error('Error during processing:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map