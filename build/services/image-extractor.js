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
exports.extractImages = void 0;
const jsdom_1 = require("jsdom");
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const constants_1 = require("../config/constants");
const extractImages = async (epub, content, chapterTitle) => {
    const dom = new jsdom_1.JSDOM(content);
    const images = Array.from(dom.window.document.querySelectorAll('img'));
    const imageInfos = [];
    for (const img of images) {
        const imgId = img.getAttribute('id');
        if (imgId) {
            try {
                // eslint-disable-next-line no-await-in-loop
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
                const imagePath = path.join(constants_1.IMAGES_DIR, fileName);
                // eslint-disable-next-line no-await-in-loop
                await fs.writeFile(imagePath, imgData.data);
                imageInfos.push({
                    id: imgId,
                    fileName,
                    mimeType: imgData.mimeType,
                    size: imgData.data.length,
                });
            }
            catch (error) {
                // eslint-disable-next-line no-console
                console.warn(`Failed to extract image ${imgId} from chapter ${chapterTitle}:`, error);
            }
        }
    }
    return imageInfos;
};
exports.extractImages = extractImages;
//# sourceMappingURL=image-extractor.js.map