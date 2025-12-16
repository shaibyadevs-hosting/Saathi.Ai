import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse-new";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// Helper function to perform OCR on a scanned PDF using Gemini Vision
async function extractTextWithGeminiOCR(pdfBuffer: Buffer, fileName: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Convert PDF buffer to base64
    const base64Pdf = pdfBuffer.toString("base64");
    
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Pdf,
        },
      },
      {
        text: `This is a scanned PDF document. Please extract ALL the text content from this document accurately. 
               Maintain the original structure and formatting as much as possible.
               Include all headers, paragraphs, lists, and any other text content.
               If there are tables, preserve their structure.
               Only return the extracted text, nothing else.`,
      },
    ]);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    throw new Error("Failed to perform OCR on scanned PDF");
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file type
    const fileName = file.name.toLowerCase();
    const isTextFile = fileName.endsWith(".txt");
    const isPdfFile = fileName.endsWith(".pdf");

    if (!isTextFile && !isPdfFile) {
      return NextResponse.json(
        { error: "Only .txt and .pdf files are supported" },
        { status: 400 }
      );
    }

    let text = "";
    let isScanned = false;

    if (isTextFile) {
      // Handle text file
      text = await file.text();
    } else if (isPdfFile) {
      // Handle PDF file using pdf-parse-new
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // First try to extract text directly
      try {
        const data = await pdfParse(buffer);
        text = data.text;
      } catch (parseError) {
        console.log("PDF parse failed, will try OCR:", parseError);
        text = "";
      }
      
      // Check if the PDF is scanned (little to no extractable text)
      const cleanedText = text.replace(/\s+/g, "").trim();
      
      if (!cleanedText || cleanedText.length < 50) {
        // PDF appears to be scanned, use Gemini Vision OCR
        console.log("PDF appears to be scanned, using Gemini Vision OCR...");
        isScanned = true;
        text = await extractTextWithGeminiOCR(buffer, file.name);
      }
    }

    // Clean up the extracted text
    console.log("Extracted text length:", text.length);

    text = text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!text || text.length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from the file. The file may be empty or the scan quality is too low.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      text,
      fileName: file.name,
      fileSize: file.size,
      isScanned,
      success: true,
    });
  } catch (error) {
    console.error("PDF Parse Error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to parse file: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred while parsing the file." },
      { status: 500 }
    );
  }
}

// Increase body size limit for file uploads
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };
