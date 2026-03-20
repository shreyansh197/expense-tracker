import { NextRequest, NextResponse } from "next/server";

const MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

    // Try each model with retries on rate limit
    for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) await delay(RETRY_DELAY_MS * attempt);

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

        if (response.status === 429) {
          console.log(`Rate limited on ${model}, attempt ${attempt + 1}/${MAX_RETRIES}`);
          continue; // retry after delay
        }

        // Non-retryable error
        const err = await response.text();
        console.error(`Gemini API error (${model}):`, response.status, err);

        if (response.status === 403 || response.status === 401) {
          return NextResponse.json(
            { error: "AI API key is invalid. Check GEMINI_API_KEY in Vercel environment variables." },
            { status: 502 }
          );
        }
        if (response.status === 400) {
          return NextResponse.json({ error: "Invalid request to AI service." }, { status: 502 });
        }
        // For other errors, try next model
        break;
      }
    }

    return NextResponse.json(
      { error: "AI service is busy. Please try again in a minute." },
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
