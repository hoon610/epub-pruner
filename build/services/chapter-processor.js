"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processChaptersInBatches = exports.processChapter = void 0;
const jsdom_1 = require("jsdom");
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
const validation_1 = require("../utils/validation");
const image_extractor_1 = require("./image-extractor");
const processChapter = async (epub, chapter, position, onProgress) => {
    const [content, rawContent] = await Promise.all([
        new Promise((resolve, reject) => {
            epub.getChapter(chapter.id, (err, text) => {
                if (err)
                    reject(new Error(`Failed to get chapter content: ${err.message}`));
                else if (!text || !(0, validation_1.validateChapterContent)(text)) {
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
    const dom = new jsdom_1.JSDOM(content);
    const textContent = dom.window.document.body.textContent || '';
    const words = textContent.trim().split(/\s+/).filter((w) => w.length > 0);
    const paragraphs = content.match(/<p[^>]*>.*?<\/p>/gs) || [];
    onProgress?.({
        currentChapter: position,
        totalChapters: epub.flow.length,
        chapterTitle: chapter.title || 'Untitled',
        status: 'extracting-images',
    });
    const images = await (0, image_extractor_1.extractImages)(epub, content, chapter.title || 'untitled');
    return {
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
};
exports.processChapter = processChapter;
const processChaptersInBatches = async (epub, batchSize = 3, onProgress) => {
    const results = [];
    for (let i = 0; i < epub.flow.length; i += batchSize) {
        const batch = epub.flow.slice(i, i + batchSize);
        const batchPromises = batch.map((chapter, idx) => (0, exports.processChapter)(epub, chapter, i + idx + 1, onProgress));
        // eslint-disable-next-line no-await-in-loop
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
    }
    return results.sort((a, b) => a.position - b.position);
};
exports.processChaptersInBatches = processChaptersInBatches;
//# sourceMappingURL=chapter-processor.js.map