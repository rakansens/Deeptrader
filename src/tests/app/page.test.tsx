import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/page';
import ChartSidebar from '@/components/chart/ChartSidebar';

// Stub next/dynamic to render a ChartSidebar for color tests
jest.mock('next/dynamic', () => () => (props: any) => (
  <ChartSidebar
    mode={null}
    onModeChange={() => {}}
    drawingColor={props.drawingColor}
    onColorChange={props.onDrawingColorChange}
  />
));

jest.mock('@/components/Navbar', () => () => <div />);
jest.mock('@/components/chat/Chat', () => () => <div />);
jest.mock('@/components/chart/ChartToolbar', () => () => <div />);

describe('Home drawing color persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes drawing color from localStorage', () => {
    localStorage.setItem('drawingColor', '#3b82f6');
    render(<Home />);
    const blueButton = screen.getByTitle('青');
    expect(blueButton.className).toContain('ring-2');
  });

  it('saves drawing color to localStorage when changed', async () => {
    const user = userEvent.setup();
    render(<Home />);
    const greenButton = screen.getByTitle('緑');
    await user.click(greenButton);
    expect(localStorage.getItem('drawingColor')).toBe('#22c55e');
  });
});
