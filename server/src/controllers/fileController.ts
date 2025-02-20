import { Request, Response, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";

const prisma = new PrismaClient();

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const uploadFile: RequestHandler = async (
  req: MulterRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    console.log("Uploaded file:");

    const file = await prisma.file.create({
      data: {
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    });

    console.log("File saved to database:");
    res.json(file);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
};

export const getFiles = async (req: Request, res: Response) => {
  try {
    const files = await prisma.file.findMany({
      orderBy: {
        uploaded: "desc",
      },
    });

    res.json(files);
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
};

export const anonymizeFile: RequestHandler = async (
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

    const ext = path.extname(file.originalName);
    const anonymizedName = `anon_${Date.now()}${ext}`;

    const updatedFile = await prisma.file.update({
      where: { id },
      data: {
        anonymizedName,
        anonymized: true,
      },
    });

    res.json(updatedFile);
  } catch (error) {
    console.error("Anonymization error:", error);
    res.status(500).json({ error: "Anonymization failed" });
  }
};
