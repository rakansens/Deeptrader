import { NextResponse } from "next/server";
import { chartAnalysisTool } from "@/mastra/tools/chartAnalysisTool";
import type { z } from "zod";
import type { ChartAnalysisResult } from "@/types";

/**
 * チャート分析ツールの入力パラメータ型
 */
interface ChartAnalysisContext {
  context: z.infer<NonNullable<typeof chartAnalysisTool.inputSchema>>;
}

type ChartAnalysisExecute = (args: ChartAnalysisContext) => Promise<ChartAnalysisResult>;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, timeframe } = body;
    
    // inputSchemaが存在することを確認
    if (!chartAnalysisTool.inputSchema) {
      throw new Error("チャート分析ツールのスキーマが未定義です");
    }
    
    const params = chartAnalysisTool.inputSchema.parse({ symbol, timeframe });
    const execute = chartAnalysisTool.execute as ChartAnalysisExecute;
    const result = await execute({ context: params });
    
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
