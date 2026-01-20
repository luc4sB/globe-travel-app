import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

type Body = {
  country: string;
  posts?: { title: string; cityName: string; body: string }[];
  messages: { role: "user" | "assistant"; content: string }[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body?.country || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const postsText =
      body.posts?.length
        ? body.posts
            .slice(0, 8)
            .map(
              (p, i) =>
                `Post ${i + 1}: ${p.title} (${p.cityName}) — ${p.body}`
            )
            .join("\n")
        : "No recent community posts available.";

    const conversation = body.messages
      .slice(-12) // keep it short
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const prompt = `
You are a travel planning assistant.
Be practical, specific, and safe.
Use the selected country as the primary context.
If community posts are provided, incorporate them as local tips (do not invent facts).
If important info is missing (dates/budget/interests), ask ONE short follow-up question.

Selected country: ${body.country}

Recent community posts:
${postsText}

Conversation:
${conversation}
`.trim();
    const resp = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const answer = resp?.text ?? "";
    return NextResponse.json({ answer });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "AI failed" }, { status: 500 });
  }
}
