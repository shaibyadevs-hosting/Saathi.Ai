import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse-new";

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

    if (isTextFile) {
      // Handle text file
      text = await file.text();
    } else if (isPdfFile) {
      // Handle PDF file using pdf-parse-new
      const buffer = Buffer.from(await file.arrayBuffer());
      const data = await pdfParse(buffer);
      text = data.text;
    }

    // Clean up the extracted text
    console.log("Extracted text:", text);

    text = text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!text || text.length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from the file. The file may be empty or contain only images.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      text,
      fileName: file.name,
      fileSize: file.size,
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
