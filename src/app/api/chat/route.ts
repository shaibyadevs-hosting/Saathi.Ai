import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Initialize the Generative AI client
const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""
);

const SYSTEM_INSTRUCTION = `You are Saathi.ai, an expert Supreme Court legal assistant specializing in Indian law. 

CRITICAL INSTRUCTIONS:
1. You must answer questions based STRICTLY on the provided 'DOCUMENT CONTEXT' below.
2. If the answer is not clearly stated or cannot be inferred from the document context, explicitly state: "I could not find this information in the provided document."
3. Use proper Indian legal terminology (e.g., "Hon'ble Court", "learned counsel", "petitioner", "respondent", "writ petition", "special leave petition", etc.)
4. Format your answers using Markdown for better readability:
   - Use **bold** for important terms and case names
   - Use bullet points for listing arguments or points
   - Use headers (##) for organizing longer responses
   - Quote relevant portions of the document when applicable
5. Be precise, professional, and concise in your responses.
6. When citing from the document, use quotation marks and reference the relevant section.
7. If asked about legal precedents or citations mentioned in the document, provide them accurately.

Remember: You are a legal research assistant, not providing legal advice. Always base your responses on the document provided.`;

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history, docText } = body as {
      message: string;
      history: ChatMessage[];
      docText: string;
    };

    // Validate inputs
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!docText || docText.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide a document context before asking questions." },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Google Generative AI API key is not configured. Please add GOOGLE_GENERATIVE_AI_API_KEY to your .env.local file.",
        },
        { status: 500 }
      );
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // Construct the prompt with document context
    const contextualPrompt = `
=== DOCUMENT CONTEXT ===
${docText}
=== END OF DOCUMENT CONTEXT ===

Based on the above document context, please answer the following question:

${message}
`;

    // Build conversation history for the model
    const chatHistory = history.map((msg) => ({
      role: msg.role as "user" | "model",
      parts: [{ text: msg.content }],
    }));

    // Start a chat session with history
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.3, // Lower temperature for more focused, accurate responses
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    // Send the message and get response
    const result = await chat.sendMessage(contextualPrompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({
      response: text,
      success: true,
    });
  } catch (error) {
    console.error("Chat API Error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("API_KEY")) {
        return NextResponse.json(
          {
            error:
              "Invalid API key. Please check your GOOGLE_GENERATIVE_AI_API_KEY.",
          },
          { status: 401 }
        );
      }
      if (error.message.includes("quota") || error.message.includes("rate")) {
        return NextResponse.json(
          { error: "API rate limit exceeded. Please try again in a moment." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `AI processing error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred while processing your request." },
      { status: 500 }
    );
  }
}
