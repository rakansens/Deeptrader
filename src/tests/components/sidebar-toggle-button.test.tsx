import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SidebarToggleButton from '@/components/chart/sidebar-toggle-button';

describe('SidebarToggleButton', () => {
  it('calls onToggle when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();
    render(<SidebarToggleButton open={false} onToggle={onToggle} />);
    await user.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalled();
  });

  it('shows correct icon based on state', () => {
    const { rerender } = render(
      <SidebarToggleButton open={false} onToggle={() => {}} />,
    );
    expect(screen.getByRole('button').innerHTML).toContain('svg');
    rerender(<SidebarToggleButton open={true} onToggle={() => {}} />);
    expect(screen.getByRole('button').title).toBe('サイドバーを非表示');
  });
});
