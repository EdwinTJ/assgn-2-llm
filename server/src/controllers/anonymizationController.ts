import { Ollama } from "ollama";
import { PrismaClient } from "@prisma/client";
import { Request, Response, RequestHandler } from "express";

const prisma = new PrismaClient();

const ollama = new Ollama({
  host: process.env.OLLAMA_URL || "http://ollama:11434",
});

// Text-based anonymization
function simpleAnonymize(text: string, word: string): string {
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedWord, "gi");

  // Replace all occurrences with [REDACTED]
  return text.replace(regex, "[REDACTED]");
}

// Function to get the file from the db then ask the user a word they want to anonymize
export const getAnonymized: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get the file from the db
    const { id } = req.params;
    const word = req.query.word as string;

    console.log("Received word to anonymize:", word);

    // Validate the word parameter
    if (!word || word.trim() === "") {
      res.status(400).json({
        error: "Word to anonymize is required",
        message: "Please provide a word to anonymize in the query parameter",
      });
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

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    if (!file.textExtracted || !file.extractedText) {
      res.status(400).json({
        error: "Text extraction is required before anonymization",
        message: "Please extract text from this file first",
      });
      return;
    }

    let anonymizedText = "";

    try {
      anonymizedText = simpleAnonymize(file.extractedText, word);
    } catch (error) {
      console.error("Processing failed, ", error);
    }

    // Save the anonymized file to the db with a new name
    const anonFilename = `${file.originalName.split(".")[0]}_anonymized.txt`;

    const savedToDb = await prisma.file.update({
      where: { id },
      data: {
        anonymizedName: anonFilename,
        anonymized: true,
        anonymizedText: anonymizedText,
      },
    });

    // Return anonymized text
    res.status(200).json({
      reply: anonymizedText,
      originalName: file.originalName,
      anonymizedName: anonFilename,
    });
  } catch (error) {
    console.error("Error in anonymization:", error);
    res.status(500).json({
      error: "Failed to process anonymization request",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get the anonymized content of a file
export const getAnonymizedContent: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  const file = await prisma.file.findUnique({
    where: { id },
    select: {
      id: true,
      originalName: true,
      anonymizedName: true,
      textExtracted: true,
      extractedText: true,
    },
  });

  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  if (!file.textExtracted || !file.extractedText) {
    res.status(400).json({
      error: "Text extraction is required before anonymization",
      message: "Please extract text from this file first",
    });
    return;
  }

  // send file to user
  res.status(200).json({ content: file.extractedText });
};

// Function to get a summary of the file content
export const getSummary: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get the file from the db
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id },
      select: {
        id: true,
        originalName: true,
        textExtracted: true,
        extractedText: true,
        hasSummary: true,
        summary: true,
      },
    });

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    if (!file.textExtracted || !file.extractedText) {
      res.status(400).json({
        error: "Text extraction is required before generating a summary",
        message: "Please extract text from this file first",
      });
      return;
    }

    // If summary already exists, return it
    if (file.hasSummary && file.summary) {
      res.status(200).json({
        id: file.id,
        originalName: file.originalName,
        summary: file.summary,
      });
      return;
    }

    let summaryText = "";

    try {
      console.log(`Generating summary for file ${file.id}`);

      let modelToUse = "phi";

      // Get available models
      try {
        const models = await ollama.list();
        console.log("Available models:", models);

        if (models.models && models.models.length > 0) {
          // Check if phi is available
          if (!models.models.some((m) => m.name === "phi")) {
            // Try tinyllama or the first available model
            modelToUse = models.models.some((m) => m.name === "tinyllama")
              ? "tinyllama"
              : models.models[0].name;
          }
        } else {
          // No models available, will use fallback
          console.log("No models available in Ollama");
        }
      } catch (error) {
        console.error("Error checking Ollama models:", error);
      }

      // Send to Ollama API
      const summaryResponse = await ollama.chat({
        model: modelToUse,
        messages: [
          {
            role: "user",
            content: `Please provide a concise summary of the following text. Focus on the main points and key information:
            "${file.extractedText.substring(0, 8000)}"
            Your summary should be clear and cover the essential content of the text. Please keep it under 500 words.`,
          },
        ],
      });

      // Get the summary text
      summaryText = summaryResponse.message.content;
      console.log("Summary generated successfully");
    } catch (ollamaError) {
      console.error("Ollama processing failed for summary:", ollamaError);

      // Fallback to a simple message if Ollama fails
      summaryText = "Summary generation failed. Please try again later.";
    }

    // Save the summary to the database
    const updatedFile = await prisma.file.update({
      where: { id },
      data: {
        summary: summaryText,
        hasSummary: true,
      },
    });

    // Return the summary to the user
    res.status(200).json({
      id: file.id,
      originalName: file.originalName,
      summary: summaryText,
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    res.status(500).json({
      error: "Failed to generate summary",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get the summary for a file
export const getFileSummary: RequestHandler = async (
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
        hasSummary: true,
        summary: true,
        textExtracted: true,
      },
    });

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    if (!file.textExtracted) {
      res.status(400).json({
        error: "Text extraction is required before viewing a summary",
        message: "Please extract text from this file first",
      });
      return;
    }

    if (!file.hasSummary || !file.summary) {
      res.status(404).json({
        error: "Summary not found",
        message: "This file does not have a summary yet",
      });
      return;
    }

    res.json({
      id: file.id,
      originalName: file.originalName,
      summary: file.summary,
    });
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
};
