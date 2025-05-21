import { POST } from "@/app/api/chart-analysis/route";
import { chartAnalysisTool } from "@/mastra/tools/chartAnalysisTool";

// chartAnalysisToolのモックを型安全に定義
jest.mock("@/mastra/tools/chartAnalysisTool", () => ({
  chartAnalysisTool: {
    inputSchema: { parse: jest.fn() },
    execute: jest.fn(),
  },
}));

// TypeScriptインターフェースを定義
interface MockedChartAnalysisTool {
  inputSchema: { 
    parse: jest.Mock 
  };
  execute: jest.Mock;
}

test("chart analysis API returns execution result", async () => {
  // 型アサーションを使用
  const mockedTool = chartAnalysisTool as unknown as MockedChartAnalysisTool;
  
  // モックの設定
  mockedTool.inputSchema.parse.mockReturnValue({
    symbol: "BTCUSDT",
    timeframe: "1h",
  });
  mockedTool.execute.mockResolvedValue({ ok: true });

  const req = new Request("http://localhost/api/chart-analysis", {
    method: "POST",
    body: JSON.stringify({ symbol: "BTCUSDT", timeframe: "1h" }),
  });
  const res = await POST(req);
  const data = await res.json();

  expect(mockedTool.inputSchema.parse).toHaveBeenCalledWith({
    symbol: "BTCUSDT",
    timeframe: "1h",
  });
  expect(mockedTool.execute).toHaveBeenCalledWith({
    context: { symbol: "BTCUSDT", timeframe: "1h" },
    suspend: expect.any(Function),
  });
  expect(data).toEqual({ ok: true });
});
