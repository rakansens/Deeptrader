import { render } from "@testing-library/react";
import IndicatorPanel from "./IndicatorPanel";

describe("IndicatorPanel", () => {
  it("matches snapshot", () => {
    const { container } = render(<IndicatorPanel />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
