"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeEpub = void 0;
const epub_1 = __importDefault(require("epub"));
const initializeEpub = (epubPath) => {
    const epubInstance = new epub_1.default(epubPath, '/images/', '/chapters/');
    return new Promise((resolve, reject) => {
        epubInstance.on('end', () => {
            resolve(epubInstance);
        });
        epubInstance.on('error', reject);
        epubInstance.parse();
    });
};
exports.initializeEpub = initializeEpub;
//# sourceMappingURL=epub-initializer.js.map