import type { IChartApi } from "lightweight-charts";

let activeChart: IChartApi | null = null;
let activeChartElement: HTMLElement | null = null;

export const setActiveChartForCapture = (
  chart: IChartApi | null,
  element: HTMLElement | null,
): void => {
  activeChart = chart;
  activeChartElement = element;
};

export const getActiveChartInstanceForCapture = (): IChartApi | null => {
  return activeChart;
};

export const getActiveChartElementForCapture = (): HTMLElement | null => {
  return activeChartElement;
};
