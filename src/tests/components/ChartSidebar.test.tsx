import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChartSidebar from "@/components/chart/ChartSidebar";
import { DRAWING_MODES } from "@/types/chart";

const baseProps = {
  drawingColor: "#ef4444",
  onColorChange: jest.fn(),
};

describe("ChartSidebar", () => {
  it("calls onModeChange when tool selected", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<ChartSidebar mode={null} onModeChange={onChange} {...baseProps} />);
    await user.click(screen.getByTitle("トレンドライン"));
    expect(onChange).toHaveBeenCalledWith(DRAWING_MODES.TRENDLINE);
  });

  it("deactivates tool when clicked twice", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <ChartSidebar
        mode={DRAWING_MODES.TRENDLINE}
        onModeChange={onChange}
        {...baseProps}
      />,
    );
    await user.click(screen.getByTitle("トレンドライン"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("switches between tools", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <ChartSidebar
        mode={DRAWING_MODES.FREEHAND}
        onModeChange={onChange}
        {...baseProps}
      />,
    );
    await user.click(screen.getByTitle("フィボナッチリトレースメント"));
    expect(onChange).toHaveBeenCalledWith(DRAWING_MODES.FIBONACCI);
  });

  it("selects horizontal line tool", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<ChartSidebar mode={null} onModeChange={onChange} {...baseProps} />);
    await user.click(screen.getByTitle("水平線"));
    expect(onChange).toHaveBeenCalledWith(DRAWING_MODES.HORIZONTAL_LINE);
  });

  it("selects ruler tool", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<ChartSidebar mode={null} onModeChange={onChange} {...baseProps} />);
    await user.click(screen.getByTitle("ルーラー"));
    expect(onChange).toHaveBeenCalledWith(DRAWING_MODES.RULER);
  });

  it("selects eraser tool", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<ChartSidebar mode={null} onModeChange={onChange} {...baseProps} />);
    await user.click(screen.getByTitle("消しゴム"));
    expect(onChange).toHaveBeenCalledWith(DRAWING_MODES.ERASER);
  });

  it("calls onClear when clear button clicked", async () => {
    const user = userEvent.setup();
    const onClear = jest.fn();
    render(
      <ChartSidebar
        mode={null}
        onModeChange={() => {}}
        onClear={onClear}
        {...baseProps}
      />,
    );
    await user.click(screen.getByTitle("全て消去"));
    expect(onClear).toHaveBeenCalled();
  });

  it("does not render clear button when onClear not provided", () => {
    render(<ChartSidebar mode={null} onModeChange={() => {}} {...baseProps} />);
    expect(screen.queryByTitle("全て消去")).not.toBeInTheDocument();
  });

  it("shows selection tool as active when mode is null", () => {
    render(<ChartSidebar mode={null} onModeChange={() => {}} {...baseProps} />);
    const selectionTool = screen.getByTitle("選択ツール");
    expect(selectionTool.className).toContain("bg-primary");
  });

  it("renders vertically", () => {
    render(<ChartSidebar mode={null} onModeChange={() => {}} {...baseProps} />);
    const sidebar = screen.getByTestId("chart-sidebar");
    expect(sidebar.className).toContain("flex-col");
  });

  it("registers shortcuts when mounted", () => {
    const registerShortcuts = jest.fn();
    const unregisterShortcuts = jest.fn();
    const { unmount } = render(
      <ChartSidebar
        mode={null}
        onModeChange={() => {}}
        registerShortcuts={registerShortcuts}
        unregisterShortcuts={unregisterShortcuts}
        {...baseProps}
      />,
    );
    expect(registerShortcuts).toHaveBeenCalled();
    unmount();
    expect(unregisterShortcuts).toHaveBeenCalled();
  });
});

