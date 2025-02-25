// controllers/textExtractionController.ts
import { Request, Response, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { addPdfExtractionJob } from "../workers/pdfWorker";
const prisma = new PrismaClient();

// Extract text from a PDF file
export const extractTextFromFile: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    // Check if the file is a PDF
    if (file.mimeType !== "application/pdf") {
      res.status(400).json({ error: "File is not a PDF" });
      return;
    }

    // Add job to the queue
    await addPdfExtractionJob(id);

    res.json({
      id: file.id,
      status: "processing",
      message: "Text extraction started in the background",
    });
  } catch (error) {
    console.error("Text extraction error:", error);
    res.status(500).json({ error: "Text extraction failed" });
  }
};

// Get the extracted text for a file
export const getExtractedText: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id },
      select: {
        id: true,
        originalName: true,
        textExtracted: true,
        extractedText: true,
      },
    });

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    if (!file.textExtracted) {
      res.status(202).json({
        id: file.id,
        status: "processing",
        message: "Text extraction is still in progress",
      });
      return;
    }

    res.json({
      id: file.id,
      originalName: file.originalName,
      textExtracted: true,
      extractedText: file.extractedText,
    });
  } catch (error) {
    console.error("Get extracted text error:", error);
    res.status(500).json({ error: "Failed to get extracted text" });
  }
};
