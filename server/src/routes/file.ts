import { Router } from "express";
import { upload } from "../middleware/multer";
import {
  uploadFile,
  getFiles,
  anonymizeFile,
} from "../controllers/fileController";
import {
  extractTextFromFile,
  getExtractedText,
} from "../controllers/textExtractionController";
import { getAnonymized } from "../controllers/anonymizedController";

const router = Router();

router.post("/upload", upload.single("file"), uploadFile);
router.get("/files", getFiles);
router.post("/anonymize/:id", anonymizeFile);
router.post("/extract-text/:id", extractTextFromFile);
router.get("/extracted-text/:id", getExtractedText);
router.get("/anonymized/:id", getAnonymized);
export default router;
