import { Router } from "express";
import {
  uploadFile,
  getFiles,
  anonymizeFile,
} from "../controllers/fileController";
import {
  extractTextFromFile,
  getExtractedText,
} from "../controllers/textExtractionController";
import {
  getAnonymized,
  getSummary,
  getFileSummary,
} from "../controllers/anonymizationController";
import {
  getAnonymizedContent,
  getFile,
} from "../controllers/anonymizedContentController";
import { upload } from "../middleware/multer";
const router = Router();

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

// Summary routes
router.post("/summary/:id", getSummary);
router.get("/summary/:id", getFileSummary);
export default router;
