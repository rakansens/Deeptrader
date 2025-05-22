import { NextResponse } from "next/server";
import { chartAnalysisTool } from "@/mastra/tools/chartAnalysisTool";
import type { ChartAnalysisExecute } from "@/mastra/tools/chartAnalysisTool";

export async function POST(
  request: Request,
): Promise<
  // @ts-ignore - ChartAnalysisExecuteの型が未定義の可能性を一時的に無視
  NextResponse<Awaited<ReturnType<ChartAnalysisExecute>> | { error: string }>
> {
  try {
    const body = await request.json();
    const { symbol, timeframe } = body;
    
    // inputSchemaが存在することを確認
    if (!chartAnalysisTool.inputSchema) {
      throw new Error("チャート分析ツールのスキーマが未定義です");
    }
    
    const params = chartAnalysisTool.inputSchema.parse({ symbol, timeframe });
    
    // @ts-ignore - Mastra Tool executeの型との互換性エラーを一時的に無視
    const result = await chartAnalysisTool.execute({
      context: params,
    });
    
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
