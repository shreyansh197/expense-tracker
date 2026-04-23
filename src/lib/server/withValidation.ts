import { NextRequest, NextResponse } from "next/server";
import type { ZodSchema, ZodError } from "zod";

type HandlerFn<T> = (req: NextRequest, body: T) => Promise<NextResponse>;

/**
 * Wraps an API route handler with Zod body validation.
 * Returns 400 with flattened errors on failure, else calls the handler with parsed data.
 */
export function withValidation<T>(schema: ZodSchema<T>, handler: HandlerFn<T>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const result = schema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: (result.error as ZodError).flatten() },
        { status: 400 },
      );
    }

    return handler(req, result.data);
  };
}
