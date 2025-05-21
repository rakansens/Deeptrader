import { POST } from "@/app/api/chart-analysis/route";
import { chartAnalysisTool } from "@/mastra/tools/chartAnalysisTool";

jest.mock("@/mastra/tools/chartAnalysisTool", () => ({
  chartAnalysisTool: {
    inputSchema: { parse: jest.fn() },
    execute: jest.fn(),
  },
}));

test("chart analysis API returns execution result", async () => {
  (chartAnalysisTool.inputSchema.parse as jest.Mock).mockReturnValue({
    symbol: "BTCUSDT",
    timeframe: "1h",
  });
  (chartAnalysisTool.execute as jest.Mock).mockResolvedValue({ ok: true });

  const req = new Request("http://localhost/api/chart-analysis", {
    method: "POST",
    body: JSON.stringify({ symbol: "BTCUSDT", timeframe: "1h" }),
  });
  const res = await POST(req);
  const data = await res.json();

  expect(chartAnalysisTool.inputSchema.parse).toHaveBeenCalledWith({
    symbol: "BTCUSDT",
    timeframe: "1h",
  });
  expect(chartAnalysisTool.execute).toHaveBeenCalledWith({
    context: { symbol: "BTCUSDT", timeframe: "1h" },
  });
  expect(data).toEqual({ ok: true });
});
