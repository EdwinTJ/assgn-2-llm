// workers/startWorker.ts
import { createPdfWorker } from "./pdfWorker";

// Start the PDF worker
const pdfWorker = createPdfWorker();

console.log("PDF extraction worker started");

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("Worker shutting down...");
  await pdfWorker.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Worker shutting down...");
  await pdfWorker.close();
  process.exit(0);
});
