import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChartSidebar, { DrawingMode } from '@/components/chart/ChartSidebar';

describe('ChartSidebar', () => {
  it('calls onModeChange when tool selected', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<ChartSidebar mode={null} onModeChange={onChange} />);
    await user.click(screen.getByTitle('トレンドライン'));
    expect(onChange).toHaveBeenCalledWith('trendline');
  });

  it('deactivates tool when clicked twice', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<ChartSidebar mode='trendline' onModeChange={onChange} />);
    await user.click(screen.getByTitle('トレンドライン'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('switches between tools', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<ChartSidebar mode='freehand' onModeChange={onChange} />);
    await user.click(screen.getByTitle('フィボナッチリトレースメント'));
    expect(onChange).toHaveBeenCalledWith('fibonacci');
  });

  it('shows selection tool as active when mode is null', () => {
    render(<ChartSidebar mode={null} onModeChange={() => {}} />);
    const selectionTool = screen.getByTitle('選択ツール');
    expect(selectionTool.className).toContain('bg-primary');
  });

  it('renders vertically', () => {
    render(<ChartSidebar mode={null} onModeChange={() => {}} />);
    const sidebar = screen.getByTestId('chart-sidebar');
    expect(sidebar.className).toContain('flex-col');
  });
});
