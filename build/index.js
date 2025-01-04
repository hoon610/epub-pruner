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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processEpub = exports.extractChapters = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const constants_1 = require("./config/constants");
const validation_1 = require("./utils/validation");
const epub_initializer_1 = require("./services/epub-initializer");
const chapter_processor_1 = require("./services/chapter-processor");
const file_writer_1 = require("./services/file-writer");
const extractChapters = async (epubPath, outputDir, onProgress) => {
    try {
        const epub = await (0, epub_initializer_1.initializeEpub)(epubPath);
        const chapters = await (0, chapter_processor_1.processChaptersInBatches)(epub, 3, onProgress);
        await (0, file_writer_1.writeFiles)(epub, chapters, outputDir);
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
    }
    catch (error) {
        throw new Error(`Failed to extract chapters: ${error.message}`);
    }
};
exports.extractChapters = extractChapters;
const processEpub = async (onProgress) => {
    try {
        const files = await fs.readdir(constants_1.INPUT_DIR);
        if (files.length === 0) {
            throw new Error('No files found in input directory');
        }
        const epubFile = files.find((file) => file.toLowerCase().endsWith('.epub'));
        if (!epubFile) {
            throw new Error('No EPUB files found in input directory');
        }
        const epubPath = path.join(constants_1.INPUT_DIR, epubFile);
        if (!await (0, validation_1.validateEpubPath)(epubPath)) {
            throw new Error('Invalid EPUB file');
        }
        // eslint-disable-next-line no-console
        console.log(`Processing EPUB file: ${epubFile}`);
        await (0, exports.extractChapters)(epubPath, constants_1.OUTPUT_DIR, onProgress);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error processing EPUB:', error);
        throw error;
    }
};
exports.processEpub = processEpub;
// CLI usage
if (require.main === module) {
    void (0, exports.processEpub)((progress) => {
        // eslint-disable-next-line no-console
        console.log(`Processing ${progress.chapterTitle} (${progress.currentChapter}/${progress.totalChapters}) - ${progress.status}`);
    })
        // eslint-disable-next-line no-console
        .then(() => console.log('Processing complete!'))
        .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Error during processing:', error);
        process.exit(1);
    });
}
__exportStar(require("./types/interfaces"), exports);
//# sourceMappingURL=index.js.map