import {
  createConversation,
  fetchConversations,
  addMessage,
  fetchMessages,
  insertTradingHistory,
} from "@/infrastructure/supabase/db-service";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({
  supabase: { from: jest.fn() },
}));

const from = (supabase as any).from;

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
    from.mockReturnValue(chain);
    await createConversation("u");
    expect(from).toHaveBeenCalledWith("conversations");
    expect(chain.insert).toHaveBeenCalledWith({ user_id: "u" });
  });

  it("fetchConversations selects records", async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    from.mockReturnValue(chain);
    await fetchConversations("u");
    expect(chain.eq).toHaveBeenCalledWith("user_id", "u");
  });

  it("addMessage inserts message", async () => {
    const chain = { insert: jest.fn().mockResolvedValue({ error: null }) };
    from.mockReturnValue(chain);
    await addMessage("c", "user", "hi");
    expect(from).toHaveBeenCalledWith("chat_messages");
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
    from.mockReturnValue(chain);
    await expect(addMessage("c", "user", "hi")).resolves.toBeUndefined();
  });

  it("fetchMessages selects messages", async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    from.mockReturnValue(chain);
    await fetchMessages("c");
    expect(chain.eq).toHaveBeenCalledWith("conversation_id", "c");
  });

  it("insertTradingHistory inserts", async () => {
    const chain = { insert: jest.fn().mockResolvedValue({ error: null }) };
    from.mockReturnValue(chain);
    await insertTradingHistory({
      user_id: "u",
      symbol: "BTCUSDT",
      type: "buy",
      quantity: 1,
      price: 1,
    });
    expect(from).toHaveBeenCalledWith("trading_history");
    expect(chain.insert).toHaveBeenCalled();
  });
});
