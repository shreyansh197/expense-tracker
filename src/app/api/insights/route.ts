import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || "";
    const { expenses, salary, categories } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured. Add GEMINI_API_KEY to environment variables." },
        { status: 500 }
      );
    }

    if (!expenses || expenses.length === 0) {
      return NextResponse.json(
        { error: "No expense data to analyze." },
        { status: 400 }
      );
    }

    const prompt = `You are a personal finance advisor. Analyze these expense records and give actionable insights.

User's monthly salary/budget: ₹${salary}

Expense data (JSON):
${JSON.stringify(expenses, null, 2)}

Category labels: ${JSON.stringify(categories)}

Give a response in this exact structure (use markdown formatting):

## 📊 Spending Summary
Brief overview of total spending vs budget for each month present in the data.

## 🔴 Top Overspending Areas
Which categories have the highest spending? Where is the user spending more than expected?

## 💡 Savings Tips
3-5 specific, actionable tips based on their actual spending patterns to save money.

## 📈 Trends
Any notable patterns — increasing/decreasing spending in categories, day-of-month patterns, etc.

## ⭐ Score
Give a financial health score out of 10 based on their spending vs budget ratio and spending distribution.

Keep it concise, friendly, and specific to their data. Use ₹ for amounts. Do not hallucinate data — only reference what's in the expenses provided.`;

    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    // Try multiple models — each has its own separate quota
    const models = ["gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash-8b"];
    let lastError = "";

    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (response.ok) {
        const data = await response.json();
        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "Unable to generate insights. Please try again.";
        return NextResponse.json({ insights: text });
      }

      const errBody = await response.text();
      console.error(`Gemini (${model}) ${response.status}:`, errBody);

      // Parse error detail
      try {
        const parsed = JSON.parse(errBody);
        lastError = parsed?.error?.message || "";
      } catch { lastError = errBody; }

      if (response.status === 403 || response.status === 401) {
        return NextResponse.json(
          { error: "AI API key is invalid. Check GEMINI_API_KEY in Vercel environment variables." },
          { status: 502 }
        );
      }

      // 429 = rate limited, 404 = model retired — try next one
      if (response.status === 429 || response.status === 404) continue;

      // Other error — return it
      return NextResponse.json(
        { error: `AI error ${response.status}: ${lastError || "Unknown error."}` },
        { status: 502 }
      );
    }

    // All models exhausted
    return NextResponse.json(
      { error: "All AI models are rate-limited. The free Gemini API has a daily limit. Please try again tomorrow, or upgrade your API key to a paid plan at https://ai.google.dev" },
      { status: 502 }
    );
  } catch (error) {
    console.error("Insights API error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
