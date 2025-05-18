import { processTimeSeriesData } from "@/lib/chart-utils";

describe("processTimeSeriesData", () => {
  const toNumber = (t: unknown): number => t as number;

  it("returns empty array when no data provided", () => {
    expect(processTimeSeriesData([], toNumber)).toEqual([]);
  });

  it("sorts data by time in ascending order", () => {
    const data = [
      { time: 3, v: "c" },
      { time: 1, v: "a" },
      { time: 2, v: "b" },
    ];
    const result = processTimeSeriesData(data, toNumber);
    expect(result.map((d) => d.time)).toEqual([1, 2, 3]);
  });

  it("removes duplicate timestamps keeping first item", () => {
    const data = [
      { time: 1, v: "a" },
      { time: 2, v: "b" },
      { time: 2, v: "c" },
      { time: 3, v: "d" },
    ];
    const result = processTimeSeriesData(data, toNumber);
    expect(result).toEqual([
      { time: 1, v: "a" },
      { time: 2, v: "b" },
      { time: 3, v: "d" },
    ]);
  });
});
