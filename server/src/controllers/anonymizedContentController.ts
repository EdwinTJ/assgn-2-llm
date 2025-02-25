import { Request, Response, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

// Get the anonymized content of a file
export const getAnonymizedContent: RequestHandler = async (
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
        anonymizedName: true,
        anonymized: true,
        extractedText: true,
        path: true,
      },
    });

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    if (!file.anonymized || !file.anonymizedName) {
      res.status(400).json({
        error: "File has not been anonymized",
        message: "This file needs to be anonymized first",
      });
      return;
    }

    // For AI anonymization, we can return the stored text that was anonymized
    // via the Ollama API
    if (file.extractedText) {
      // For now, we'll return the extracted text as a placeholder
      // In a real app, we'd want to store the anonymized text separately
      res.json({
        id: file.id,
        originalName: file.originalName,
        anonymizedName: file.anonymizedName,
        content: `${file.extractedText}\n\n[This content has been anonymized]`,
      });
      return;
    }

    // For standard anonymization (non-AI), we would typically read the file from disk
    // Here we're returning a placeholder message
    res.json({
      id: file.id,
      originalName: file.originalName,
      anonymizedName: file.anonymizedName,
      content:
        "This file has been anonymized using the standard method. Original sensitive information has been removed.",
    });
  } catch (error) {
    console.error("Error fetching anonymized content:", error);
    res.status(500).json({
      error: "Failed to get anonymized content",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get a single file by ID
export const getFile: RequestHandler = async (
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
        anonymizedName: true,
        anonymized: true,
        textExtracted: true,
        mimeType: true,
        size: true,
      },
    });

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    res.json(file);
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).json({ error: "Failed to fetch file details" });
  }
};
