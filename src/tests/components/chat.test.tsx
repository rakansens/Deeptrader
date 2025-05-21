import { render, screen, waitFor } from "@testing-library/react";
import { TextEncoder, TextDecoder } from "util";
import { ReadableStream } from "stream/web";

global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder;
global.ReadableStream = ReadableStream as any;
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
import userEvent from "@testing-library/user-event";
import Chat from "@/components/chat/Chat";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";

const baseProps = { symbol: "BTCUSDT", timeframe: "1h" as const };

const uploadMock = jest.fn().mockResolvedValue({ error: null });
const getPublicUrlMock = jest.fn(() => ({
  data: { publicUrl: "http://example.com/img.png" },
}));

jest.mock("@/hooks/use-toast");
jest.mock("@/hooks/use-settings");
jest.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
      })),
    },
  },
}));
const toastMock = jest.fn();
(useToast as jest.Mock).mockReturnValue({
  toast: toastMock,
  dismiss: jest.fn(),
  toasts: [],
});
(useSettings as jest.Mock).mockReturnValue({
  voiceInputEnabled: false,
  setVoiceInputEnabled: jest.fn(),
  speechSynthesisEnabled: false,
  setSpeechSynthesisEnabled: jest.fn(),
  refreshSettings: jest.fn(),
  userAvatar: "",
  setUserAvatar: jest.fn(),
  assistantAvatar: "",
  setAssistantAvatar: jest.fn(),
});

describe("Chat", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe("メッセージ送信機能", () => {
    it("submits message and displays assistant reply", async () => {
      const user = userEvent.setup();
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode("hi there"));
          controller.close();
        },
      });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        body: stream,
        headers: new Headers(),
      }) as unknown as typeof fetch;

      render(<Chat {...baseProps} />);
      const textarea = screen.getByPlaceholderText("メッセージを入力...");
      await user.type(textarea, "hello");
      await user.keyboard("{Enter}");

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());
      expect(screen.getByText("U")).toBeInTheDocument();
      await waitFor(() =>
        expect(screen.getByText("hi there")).toBeInTheDocument(),
      );
      expect(screen.getByText("AI")).toBeInTheDocument();
    });

    it("clears input immediately after sending", async () => {
      const user = userEvent.setup();
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode("pong"));
          controller.close();
        },
      });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        body: stream,
        headers: new Headers(),
      }) as unknown as typeof fetch;

      render(<Chat {...baseProps} />);
      const textarea = screen.getByPlaceholderText("メッセージを入力...");
      await user.type(textarea, "ping");
      await user.keyboard("{Enter}");
      expect(textarea).toHaveValue("");
      await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    });

    it("shows loading indicator while waiting for response", async () => {
      const user = userEvent.setup();
      const encoder = new TextEncoder();
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise<any>((r) => {
        resolveFetch = r;
      });
      global.fetch = jest.fn().mockReturnValue(fetchPromise);

      render(<Chat {...baseProps} />);
      const textarea = screen.getByPlaceholderText("メッセージを入力...");
      await user.type(textarea, "loading");
      await user.keyboard("{Enter}");
      expect(screen.getByText("考え中...")).toBeInTheDocument();
      const stream = new ReadableStream({
        start(controller) {
          setTimeout(() => {
            controller.enqueue(encoder.encode("done"));
            controller.close();
          }, 50);
        },
      });
      resolveFetch!({
        ok: true,
        body: stream,
        headers: new Headers(),
      });
      await waitFor(() =>
        expect(screen.queryByText("考え中...")).not.toBeInTheDocument(),
      );
    });

    it("displays error message when API fails", async () => {
      const user = userEvent.setup();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "fail",
        headers: new Headers(),
      }) as unknown as typeof fetch;

      render(<Chat {...baseProps} />);
      const textarea = screen.getByPlaceholderText("メッセージを入力...");
      await user.type(textarea, "err");
      await user.keyboard("{Enter}");

      await waitFor(() => expect(screen.getByText("fail")).toBeInTheDocument());
    });
  });

  describe("新しい会話機能", () => {
    it("sidebar shows new chat button", () => {
      render(<Chat {...baseProps} />);
      expect(
        screen.getByRole("button", { name: "新しいチャット" }),
      ).toBeInTheDocument();
    });

    it("creates new conversation and clears messages", async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode("hi"));
          controller.close();
        },
      });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        body: stream,
        headers: new Headers(),
      }) as unknown as typeof fetch;

      const user = userEvent.setup();
      render(<Chat {...baseProps} />);

      const textarea = screen.getByPlaceholderText("メッセージを入力...");
      await user.type(textarea, "hello{enter}");

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());
      expect(screen.getByText("hello")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "新しいチャット" }));

      expect(screen.queryByText("hello")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "会話 2" }).className).toMatch(
        /bg-accent/,
      );
    });
  });

  describe("サイドバー切替", () => {
    it("toggles sidebar visibility", async () => {
      const user = userEvent.setup();
      render(<Chat {...baseProps} />);

      const sidebar = screen.getByRole("complementary");
      expect(sidebar.className).toMatch(/translate-x-0/);

      const hideBtn = screen.getAllByLabelText("スレッドを非表示")[0];
      await user.click(hideBtn);

      expect(sidebar.className).toMatch(/-translate-x-full/);

      const showBtn = screen.getAllByLabelText("スレッドを表示")[0];
      await user.click(showBtn);

      expect(sidebar.className).toMatch(/translate-x-0/);
    });

    it("applies animation classes", () => {
      render(<Chat {...baseProps} />);
      const sidebar = screen.getByRole("complementary");
      expect(sidebar.className).toMatch(/transition-transform/);
    });
  });

  it("scrolls to bottom when message list updates", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "hi" }),
    } as Response);

    const { container } = render(<Chat {...baseProps} />);
    const list = container.querySelector("div.space-y-4") as HTMLDivElement;
    let top = 0;
    Object.defineProperty(list, "scrollHeight", {
      get: () => 100,
      configurable: true,
    });
    Object.defineProperty(list, "scrollTop", {
      get: () => top,
      set: (v) => {
        top = v as number;
      },
      configurable: true,
    });

    const textarea = screen.getByPlaceholderText("メッセージを入力...");
    await user.type(textarea, "hello");
    await user.keyboard("{Enter}");
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    await waitFor(() => expect(top).toBe(100));
  });

  it("shows toast when error occurs", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "fail" }),
    } as Response);

    render(<Chat {...baseProps} />);
    const textarea = screen.getByPlaceholderText("メッセージを入力...");
    await user.type(textarea, "err");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(toastMock).toHaveBeenCalled());
    expect(screen.getByLabelText("送信")).toBeInTheDocument();
  });

  it("renders export conversation button", () => {
    render(<Chat {...baseProps} />);
    expect(
      screen.getByRole("button", { name: "会話をエクスポート" }),
    ).toBeInTheDocument();
  });

  it("associates textarea with label", () => {
    render(<Chat {...baseProps} />);
    expect(screen.getByLabelText("メッセージ入力")).toBeInTheDocument();
  });

  it("message list has aria-live polite", () => {
    const { container } = render(<Chat {...baseProps} />);
    const list = container.querySelector("div.space-y-4") as HTMLDivElement;
    expect(list.getAttribute("aria-live")).toBe("polite");
  });

  it("shows screenshot button", () => {
    render(<Chat {...baseProps} />);
    expect(screen.getByLabelText("スクリーンショット送信")).toBeInTheDocument();
  });

  it("renders image message", () => {
    jest.spyOn(require("@/hooks/use-chat"), "useChat").mockReturnValue({
      messages: [
        {
          id: "1",
          role: "user",
          content: "data:image/png;base64,x",
          type: "image",
          timestamp: 0,
        },
      ],
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
      sendImageMessage: jest.fn(),
    } as any);

    render(<Chat {...baseProps} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("uploads image and sends message", async () => {
    const user = userEvent.setup();
    const sendMessageMock = jest.fn().mockResolvedValue(undefined);
    jest.spyOn(require("@/hooks/use-chat"), "useChat").mockReturnValue({
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
      sendMessage: sendMessageMock,
      sendImageMessage: jest.fn(),
    } as any);

    render(<Chat {...baseProps} />);
    const file = new File(["img"], "test.png", { type: "image/png" });
    const input = screen.getByTestId("image-input") as HTMLInputElement;
    await user.upload(input, file);

    expect(sendMessageMock).toHaveBeenCalled();
    expect(sendMessageMock.mock.calls[0][1]).toBe(file);
  });
});
