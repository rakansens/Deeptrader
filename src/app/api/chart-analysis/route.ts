import { NextResponse } from "next/server";
import { chartAnalysisTool } from "@/mastra/tools/chartAnalysisTool";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, timeframe } = body;
    const params = chartAnalysisTool.inputSchema?.parse({ symbol, timeframe });
    const result = await (
      chartAnalysisTool.execute as (arg: any) => Promise<any>
    )({ context: params });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
