// workers/pdfWorker.ts
import { PrismaClient } from "@prisma/client";
import { Worker, Queue, Job } from "bullmq";
import * as fs from "fs";
import pdfParse from "pdf-parse";

const prisma = new PrismaClient();

interface PdfExtractionJob {
  fileId: string;
}

// Function to extract text from PDF using pdf-parse
async function extractTextFromPdf(filePath: string): Promise<string> {
  try {
    // Read the PDF file as a buffer
    const dataBuffer = fs.readFileSync(filePath);

    // Parse the PDF
    const data = await pdfParse(dataBuffer);

    // Return the text
    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw error;
  }
}

// Create a worker to process PDF extraction jobs
export const createPdfWorker = () => {
  return new Worker(
    "pdf-extraction",
    async (job: Job<PdfExtractionJob>) => {
      try {
        const { fileId } = job.data;

        // Get file from database
        const file = await prisma.file.findUnique({
          where: { id: fileId },
        });

        if (!file) {
          throw new Error(`File with ID ${fileId} not found`);
        }

        // Check if the file is a PDF
        if (file.mimeType !== "application/pdf") {
          throw new Error(`File with ID ${fileId} is not a PDF`);
        }

        // Extract text from PDF
        const text = await extractTextFromPdf(file.path);

        // Update the file with extracted text
        await prisma.file.update({
          where: { id: fileId },
          data: {
            extractedText: text,
            textExtracted: true,
          },
        });

        return { success: true, fileId };
      } catch (error) {
        console.error("PDF extraction error:", error);
        throw error;
      }
    },
    {
      connection: {
        host: process.env.REDIS_HOST || "redis",
        port: parseInt(process.env.REDIS_PORT || "6379"),
      },
    }
  );
};

// Create a queue to add jobs
export const pdfQueue = new Queue("pdf-extraction", {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
});

// Add job to the queue
export const addPdfExtractionJob = async (fileId: string) => {
  await pdfQueue.add("extract-text", { fileId });
};
