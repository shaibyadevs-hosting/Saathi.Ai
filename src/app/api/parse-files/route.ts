import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse-new";
import mammoth from "mammoth";

// File limits
const MAX_PDF_WORD_FILES = 3;
const MAX_IMAGE_FILES = 5;
const ALLOWED_DOC_TYPES = [".pdf", ".txt", ".doc", ".docx"];
const ALLOWED_IMAGE_TYPES = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

interface ParsedFile {
  fileName: string;
  fileType: string;
  text: string;
  fileSize: number;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Categorize files
    const docFiles: File[] = [];
    const imageFiles: File[] = [];

    for (const file of files) {
      const fileName = file.name.toLowerCase();
      const ext = "." + fileName.split(".").pop();

      if (ALLOWED_DOC_TYPES.includes(ext)) {
        docFiles.push(file);
      } else if (ALLOWED_IMAGE_TYPES.includes(ext)) {
        imageFiles.push(file);
      } else {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.name}` },
          { status: 400 }
        );
      }
    }

    // Validate limits
    if (docFiles.length > MAX_PDF_WORD_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PDF_WORD_FILES} document files allowed (PDF/Word/TXT)` },
        { status: 400 }
      );
    }

    if (imageFiles.length > MAX_IMAGE_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IMAGE_FILES} image files allowed` },
        { status: 400 }
      );
    }

    const parsedFiles: ParsedFile[] = [];
    const combinedTexts: string[] = [];

    // Process document files
    for (const file of docFiles) {
      const fileName = file.name.toLowerCase();
      let text = "";

      if (fileName.endsWith(".txt")) {
        text = await file.text();
      } else if (fileName.endsWith(".pdf")) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const data = await pdfParse(buffer);
        text = data.text;
      } else if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) {
        // For Word files, we'll extract basic text
        // Note: Full Word parsing requires mammoth or similar library
        const buffer = Buffer.from(await file.arrayBuffer());
        // Try to extract any readable text content
        text = await extractWordText(buffer, fileName);
      }

      // Clean up text
      text = text
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (text) {
        parsedFiles.push({
          fileName: file.name,
          fileType: "document",
          text,
          fileSize: file.size,
        });
        combinedTexts.push(`\n\n--- Document: ${file.name} ---\n\n${text}`);
      }
    }

    // Process image files (will be sent to Gemini Vision API for OCR)
    for (const file of imageFiles) {
      const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
      const mimeType = getMimeType(file.name);

      parsedFiles.push({
        fileName: file.name,
        fileType: "image",
        text: "", // Text will be extracted via Vision API
        fileSize: file.size,
      });

      // Store image data for Vision API processing
      combinedTexts.push(`\n\n--- Image: ${file.name} (Pending OCR) ---\n`);
    }

    const combinedText = combinedTexts.join("").trim();

    if (!combinedText || parsedFiles.length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from any of the provided files." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      text: combinedText,
      files: parsedFiles,
      totalFiles: files.length,
      documentCount: docFiles.length,
      imageCount: imageFiles.length,
      success: true,
    });
  } catch (error) {
    console.error("File Parse Error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to parse files: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred while parsing the files." },
      { status: 500 }
    );
  }
}

// Helper function to extract text from Word documents
async function extractWordText(buffer: Buffer, fileName: string): Promise<string> {
  try {
    if (fileName.endsWith(".docx")) {
      // Use mammoth to extract text from .docx files
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    } else if (fileName.endsWith(".doc")) {
      // .doc files (older Word format) - mammoth doesn't support them fully
      // Try basic extraction, but recommend converting to .docx
      try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value || `[Old Word format: ${fileName} - Please convert to .docx for better results]`;
      } catch {
        return `[Old Word format: ${fileName} - Please convert to .docx for better support]`;
      }
    }
    return "";
  } catch (error) {
    console.error("Word extraction error:", error);
    return `[Error extracting text from: ${fileName}]`;
  }
}

// Helper function to get MIME type from filename
function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split(".").pop();
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}
