import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  resetPassword,
} from "@/infrastructure/supabase/auth-service";
import { supabase } from "@/lib/supabase";

type SupabaseType = typeof supabase;

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

const auth = (supabase as unknown as SupabaseType).auth;

describe("auth-service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("signIn calls supabase", async () => {
    (auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: { id: "1" } },
      error: null,
    });
    await signIn("a", "b");
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "a",
      password: "b",
    });
  });

  it("signUp calls supabase", async () => {
    (auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: { id: "1" } },
      error: null,
    });
    await signUp("a", "b");
    expect(auth.signUp).toHaveBeenCalledWith({ email: "a", password: "b" });
  });

  it("signOut calls supabase", async () => {
    (auth.signOut as jest.Mock).mockResolvedValue({ error: null });
    await signOut();
    expect(auth.signOut).toHaveBeenCalled();
  });

  it("getCurrentUser calls supabase", async () => {
    (auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: null,
    });
    await getCurrentUser();
    expect(auth.getUser).toHaveBeenCalled();
  });

  it("resetPassword calls supabase", async () => {
    (auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
      error: null,
    });
    await resetPassword("test@example.com");
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("test@example.com");
  });
});
