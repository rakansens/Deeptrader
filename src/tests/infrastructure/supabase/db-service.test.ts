import {
  createConversation,
  fetchConversations,
  addMessage,
  fetchMessages,
  insertTradingHistory,
} from "@/infrastructure/supabase/db-service";
import { createBrowserClient } from '@/utils/supabase/client-entry';

// モックの設定
const mockSupabase = { from: jest.fn() };
jest.mock("@/utils/supabase/client-entry", () => ({
  createBrowserClient: jest.fn().mockReturnValue(mockSupabase)
}));

describe("db-service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("createConversation inserts record", async () => {
    const chain = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: "c" }, error: null }),
    };
    mockSupabase.from.mockReturnValue(chain);
    await createConversation("u");
    expect(mockSupabase.from).toHaveBeenCalledWith("conversations");
    expect(chain.insert).toHaveBeenCalledWith({ user_id: "u" });
  });

  it("fetchConversations selects records", async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    mockSupabase.from.mockReturnValue(chain);
    await fetchConversations("u");
    expect(chain.eq).toHaveBeenCalledWith("user_id", "u");
  });

  it("addMessage inserts message", async () => {
    const chain = { insert: jest.fn().mockResolvedValue({ error: null }) };
    mockSupabase.from.mockReturnValue(chain);
    await addMessage("c", "user", "hi");
    expect(mockSupabase.from).toHaveBeenCalledWith("chat_messages");
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: "c",
        sender: "user",
        content: "hi",
      })
    );
  });

  it("addMessage handles error without throwing", async () => {
    const chain = {
      insert: jest.fn().mockResolvedValue({ error: { code: "123", message: "e" } }),
    };
    mockSupabase.from.mockReturnValue(chain);
    await expect(addMessage("c", "user", "hi")).resolves.toBeUndefined();
  });

  it("fetchMessages selects messages", async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    mockSupabase.from.mockReturnValue(chain);
    await fetchMessages("c");
    expect(chain.eq).toHaveBeenCalledWith("conversation_id", "c");
  });

  it("insertTradingHistory inserts", async () => {
    const chain = { insert: jest.fn().mockResolvedValue({ error: null }) };
    mockSupabase.from.mockReturnValue(chain);
    await insertTradingHistory({
      user_id: "u",
      symbol: "BTCUSDT",
      type: "buy",
      quantity: 1,
      price: 1,
    });
    expect(mockSupabase.from).toHaveBeenCalledWith("trading_history");
    expect(chain.insert).toHaveBeenCalled();
  });
});
