import { Ollama } from "ollama";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

const ollama = new Ollama({
  host: process.env.OLLAMA_URL || "http://ollama:11434",
});

// Function to get the file from the db then ask the user a word they want to anonymize
export const getAnonymized = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get the file from the db
    const { id } = req.params;
    const word = req.query.word as string;

    if (!word) {
      res.status(400).json({ error: "Word to anonymize is required" });
      return;
    }

    const file = await prisma.file.findUnique({
      where: { id },
      select: {
        id: true,
        originalName: true,
        textExtracted: true,
        extractedText: true,
      },
    });

    // If the file doesn't exist, return an error
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    // Check if text was extracted
    if (!file.textExtracted || !file.extractedText) {
      res.status(400).json({
        error: "Text extraction is required before anonymization",
        message: "Please extract text from this file first",
      });
      return;
    }

    console.log(
      `Sending request to Ollama to anonymize word "${word}" in file ${file.id}`
    );

    // Send the file text and the word to the Ollama API
    const anonymized = await ollama.chat({
      model: "tinyllama",
      messages: [
        {
          role: "user",
          content: `I have the following text: "${file.extractedText}". 
          Replace all occurrences of the word "${word}" and its variations with "[REDACTED]". 
          Return only the modified text, with no additional commentary.`,
        },
      ],
    });

    // Save the anonymized file to the db with a new name
    const anonFilename = `${file.originalName.split(".")[0]}_anonymized.txt`;

    const savedToDb = await prisma.file.update({
      where: { id },
      data: {
        anonymizedName: anonFilename,
        anonymized: true,
      },
    });

    // Return the anonymized text to the user
    res.status(200).json({
      reply: anonymized.message.content,
      originalName: file.originalName,
      anonymizedName: anonFilename,
    });
  } catch (error) {
    console.error("Error in Ollama anonymization:", error);
    res.status(500).json({
      error: "Failed to process anonymization request",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
