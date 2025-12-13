import { NextResponse } from "next/server";
import { geminiModel } from "@/lib/llm";
import {
  fiveLineSummaryPrompt,
  detailedSummaryPrompt,
  chronologyPrompt,
} from "@/lib/prompts";

export async function POST(req: Request) {
  const { text, type } = await req.json();

  if (!text || !type) {
    return NextResponse.json(
      { error: "Missing input" },
      { status: 400 }
    );
  }

  let prompt = "";

  if (type === "short") prompt = fiveLineSummaryPrompt(text);
  if (type === "detailed") prompt = detailedSummaryPrompt(text);
  if (type === "chronology") prompt = chronologyPrompt(text);

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();

    return NextResponse.json({ result: response });
  } catch (error) {
    return NextResponse.json(
      { error: "AI processing failed" },
      { status: 500 }
    );
  }
}
