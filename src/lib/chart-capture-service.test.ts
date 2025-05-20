import {
  setActiveChartForCapture,
  getActiveChartInstanceForCapture,
  getActiveChartElementForCapture,
} from './chart-capture-service';
import type { IChartApi } from 'lightweight-charts';

// Mock IChartApi and HTMLElement for testing purposes
const getMockChartApi = (): IChartApi => {
  return {
    // Mock only the methods/properties that might be relevant if the service did more,
    // but for current service, the instance itself is opaque.
    // Adding a dummy property to make it a unique object.
    _id: Math.random().toString(),
  } as IChartApi;
};

const getMockChartElement = (): HTMLElement => {
  return document.createElement('div');
};

describe('ChartCaptureService', () => {
  let mockChart: IChartApi;
  let mockElement: HTMLElement;

  beforeEach(() => {
    // Reset active chart and element before each test
    setActiveChartForCapture(null, null);
    mockChart = getMockChartApi();
    mockElement = getMockChartElement();
  });

  it('should initially return null for active chart and element', () => {
    expect(getActiveChartInstanceForCapture()).toBeNull();
    expect(getActiveChartElementForCapture()).toBeNull();
  });

  it('should set and get the active chart instance', () => {
    setActiveChartForCapture(mockChart, null);
    expect(getActiveChartInstanceForCapture()).toBe(mockChart);
    expect(getActiveChartElementForCapture()).toBeNull();
  });

  it('should set and get the active chart element', () => {
    setActiveChartForCapture(null, mockElement);
    expect(getActiveChartInstanceForCapture()).toBeNull();
    expect(getActiveChartElementForCapture()).toBe(mockElement);
  });

  it('should set and get both active chart instance and element', () => {
    setActiveChartForCapture(mockChart, mockElement);
    expect(getActiveChartInstanceForCapture()).toBe(mockChart);
    expect(getActiveChartElementForCapture()).toBe(mockElement);
  });

  it('should clear the active chart and element when null is passed', () => {
    setActiveChartForCapture(mockChart, mockElement); // Set them first
    expect(getActiveChartInstanceForCapture()).toBe(mockChart); // Verify they are set

    setActiveChartForCapture(null, null); // Clear them
    expect(getActiveChartInstanceForCapture()).toBeNull();
    expect(getActiveChartElementForCapture()).toBeNull();
  });

  it('should allow updating the active chart and element', () => {
    const anotherMockChart = getMockChartApi();
    const anotherMockElement = getMockChartElement();

    setActiveChartForCapture(mockChart, mockElement);
    expect(getActiveChartInstanceForCapture()).toBe(mockChart);
    expect(getActiveChartElementForCapture()).toBe(mockElement);

    setActiveChartForCapture(anotherMockChart, anotherMockElement);
    expect(getActiveChartInstanceForCapture()).toBe(anotherMockChart);
    expect(getActiveChartElementForCapture()).toBe(anotherMockElement);
  });
});
