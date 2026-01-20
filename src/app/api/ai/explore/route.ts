import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

type Body = {
  messages: { role: "user" | "assistant"; content: string }[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const conversation = body.messages
      .slice(-14)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const prompt = `
You are a travel discovery assistant for a globe travel app.
Your job is to recommend COUNTRIES (not cities) based on user preferences.

Rules:
- If the user is vague, ask up to 3 concise clarifying questions (max 3).
- Otherwise suggest 4–6 countries max.
- For each country include:
  1) One short “why” sentence
  2) 3 bullet highlights:
     - vibe/activities
     - best season/months
     - rough budget range (low / mid / high — do not use exact prices)
- Do not invent real-time prices, news, or visa rules. Use general knowledge.
- Keep answers compact and actionable.

Finish with:
"Want me to narrow it down to 2 and suggest ideal cities?"

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
