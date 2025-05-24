import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  getServerSideUser,
  resetPassword,
} from "@/infrastructure/supabase/auth-service";
import { createClient } from '@/utils/supabase';

// モックの設定
const mockSupabase = { 
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    resetPasswordForEmail: jest.fn()
  }
};

jest.mock("@/utils/supabase", () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe("auth-service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("signIn calls supabase", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "1" } },
      error: null,
    });
    await signIn("a", "b");
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "a",
      password: "b",
    });
  });

  it("signUp calls supabase", async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: "user1" } },
      error: null,
    });
    await signUp("a", "b");
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({ email: "a", password: "b" });
  });

  it("signOut calls supabase", async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });
    await signOut();
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it("getCurrentUser calls supabase", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    await getCurrentUser();
    expect(mockSupabase.auth.getUser).toHaveBeenCalled();
  });

  it("resetPassword calls supabase", async () => {
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
      error: null,
    });
    await resetPassword("test@example.com");
    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith("test@example.com");
  });
});
