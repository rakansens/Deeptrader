import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Chat from "@/components/chat/Chat";
import { useScreenshot } from "@/hooks/use-screenshot";

jest.mock("@/hooks/use-screenshot");

jest.mock("@/hooks/use-settings", () => ({
  useSettings: () => ({
    voiceInputEnabled: false,
    speechSynthesisEnabled: false,
    refreshSettings: jest.fn(),
    userAvatar: "",
    assistantAvatar: "",
  }),
}));

test("screenshot flow fetches analysis and includes it in prompt", async () => {
  const sendImageMessage = jest.fn();
  jest.spyOn(require("@/hooks/chat/use-chat"), "useChat").mockReturnValue({
    messages: [],
    input: "",
    setInput: jest.fn(),
    loading: false,
    error: null,
    conversations: [],
    selectedId: "1",
    selectConversation: jest.fn(),
    newConversation: jest.fn(),
    renameConversation: jest.fn(),
    removeConversation: jest.fn(),
    sidebarOpen: false,
    toggleSidebar: jest.fn(),
    sendMessage: jest.fn(),
    sendImageMessage,
  } as any);

  (useScreenshot as jest.Mock).mockImplementation(({ onCapture }) => ({
    captureScreenshot: () => onCapture("data:image/png;base64,x"),
  }));

  global.fetch = jest.fn().mockImplementation((input: RequestInfo) => {
    if (typeof input === "string" && input.includes("/api/chart-analysis")) {
      return Promise.resolve(
        new Response(
          JSON.stringify({ indicators: [{ name: "RSI", value: 50 }] }),
          { status: 200 },
        ),
      );
    }
    return Promise.resolve(new Response());
  }) as any;

  const user = userEvent.setup();
  render(<Chat symbol="BTCUSDT" timeframe="1h" />);
  await user.click(screen.getByLabelText("スクリーンショット送信"));

  await waitFor(() => expect(sendImageMessage).toHaveBeenCalled());
  const prompt = sendImageMessage.mock.calls[0][1];
  expect(prompt).toContain("RSI");
});
