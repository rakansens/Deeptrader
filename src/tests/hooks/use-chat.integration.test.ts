import { renderHook, act, waitFor } from "@testing-library/react";
import { TextEncoder, TextDecoder } from "util";
import { ReadableStream } from "stream/web";
import { useChat } from "@/hooks/use-chat";
import {
  fetchMessages,
  addMessage,
} from "@/infrastructure/supabase/db-service";

jest.mock("@/infrastructure/supabase/db-service", () => ({
  fetchMessages: jest.fn(),
  addMessage: jest.fn().mockResolvedValue(undefined),
}));

import type { OpenAIChatMessage } from "@/types";

jest.mock("ai/react", () => {
  return {
    useChat: <T,>({ initialMessages }: { initialMessages?: T[] }) => {
      const React = require("react") as typeof import("react");
      const [messages, setMessages] = React.useState<T[]>(initialMessages || []);
      const [input, setInput] = React.useState("");
      const append = async (msg: T) => {
        setMessages((prev: T[]) => [
          ...prev,
          msg,
          { role: "assistant", content: "pong" } as T,
        ]);
      };
      return {
        messages,
        input,
        setInput,
        append,
        setMessages,
        isLoading: false,
        error: null,
      };
    },
  };
});

global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder;
global.ReadableStream = ReadableStream as any;
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;

const mockedFetch = fetchMessages as jest.MockedFunction<typeof fetchMessages>;
const mockedAdd = addMessage as jest.MockedFunction<typeof addMessage>;

mockedFetch.mockResolvedValue([
  {
    id: 1,
    conversation_id: "current",
    sender: "user",
    content: "hello",
    created_at: new Date().toISOString(),
  },
]);

describe("useChat integration", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("loads and sends messages via supabase", async () => {
    const { result } = renderHook(() => useChat());

    await waitFor(() => expect(result.current.messages.length).toBe(1));

    act(() => {
      result.current.setInput("ping");
    });
    await act(async () => {
      await result.current.sendMessage();
    });

    expect(mockedAdd).toHaveBeenCalled();
  });
});
