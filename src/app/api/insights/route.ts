import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: NextRequest) {
  try {
    const { expenses, salary, categories } = await req.json();

    if (!GEMINI_API_KEY) {
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

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini API error:", err);
      return NextResponse.json(
        { error: "AI service temporarily unavailable. Please try again." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Unable to generate insights. Please try again.";

    return NextResponse.json({ insights: text });
  } catch (error) {
    console.error("Insights API error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
