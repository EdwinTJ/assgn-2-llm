import { Router } from "express";
import { upload } from "../middleware/multer";
import {
  uploadFile,
  getFiles,
  anonymizeFile,
} from "../controllers/fileController";

const router = Router();

router.post("/upload", upload.single("file"), uploadFile);
router.get("/files", getFiles);
router.post("/anonymize/:id", anonymizeFile);

export default router;
