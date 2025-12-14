import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Validate audio file type
    const allowedTypes = [
      "audio/mp3",
      "audio/mpeg",
      "audio/wav",
      "audio/wave",
      "audio/webm",
      "audio/ogg",
      "audio/m4a",
      "audio/mp4",
      "audio/x-m4a",
    ];

    const allowedExtensions = [".mp3", ".wav", ".webm", ".ogg", ".m4a", ".mp4"];
    const fileName = audioFile.name.toLowerCase();
    const ext = "." + fileName.split(".").pop();

    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: "Unsupported audio format. Please use MP3, WAV, WEBM, OGG, or M4A." },
        { status: 400 }
      );
    }

    // Check file size (max 25MB)
    const maxSize = 25 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: "Audio file too large. Maximum size is 25MB." },
        { status: 400 }
      );
    }

    // Convert audio to base64
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const base64Audio = buffer.toString("base64");

    // Get MIME type
    const mimeType = getMimeType(ext);

    // Use Gemini to transcribe audio
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Audio,
        },
      },
      {
        text: `Please transcribe this audio recording accurately. 
        
Instructions:
- Transcribe all spoken content word-for-word
- Include speaker labels if multiple speakers are detected (Speaker 1, Speaker 2, etc.)
- Preserve any pauses or significant non-verbal sounds in [brackets]
- Format the transcription in clear paragraphs
- If the audio contains legal or technical terminology, transcribe it precisely
- If any part is unclear or inaudible, indicate with [inaudible]

Provide only the transcription without any additional commentary.`,
      },
    ]);

    const transcription = result.response.text();

    if (!transcription || transcription.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not transcribe the audio. Please ensure the audio has clear speech." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      text: transcription,
      fileName: audioFile.name,
      fileSize: audioFile.size,
      duration: null, // Duration can be extracted if needed
      success: true,
    });
  } catch (error) {
    console.error("Audio Transcription Error:", error);

    if (error instanceof Error) {
      if (error.message.includes("API_KEY")) {
        return NextResponse.json(
          { error: "Invalid API key. Please check your GEMINI_API_KEY." },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: `Transcription failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred while transcribing the audio." },
      { status: 500 }
    );
  }
}

function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".webm": "audio/webm",
    ".ogg": "audio/ogg",
    ".m4a": "audio/mp4",
    ".mp4": "audio/mp4",
  };
  return mimeTypes[ext] || "audio/mpeg";
}
