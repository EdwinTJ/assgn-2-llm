import express from "express";
import multer from "multer";
import path from "path";
import {
  uploadFile,
  getFiles,
  anonymizeFile,
} from "../controllers/fileController";
import {
  extractTextFromFile,
  getExtractedText,
} from "../controllers/textExtractionController";
import { getAnonymized } from "../controllers/anonymizationController";
import {
  getAnonymizedContent,
  getFile,
} from "../controllers/anonymizedContentController";

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// File routes
router.post("/upload", upload.single("file"), uploadFile);
router.get("/files", getFiles);
router.get("/files/:id", getFile);
router.post("/anonymize/:id", anonymizeFile);
router.post("/extract-text/:id", extractTextFromFile);
router.get("/extracted-text/:id", getExtractedText);

// AI Anonymization
router.get("/anonymized/:id", getAnonymized);

// Get anonymized content
router.get("/anonymized-content/:id", getAnonymizedContent);

export default router;
