import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthForm from "@/components/Auth/AuthForm";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
  },
}));

const mockSignInWithPassword = supabase.auth.signInWithPassword as jest.Mock;

describe("AuthForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays error message on login failure", async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({ error: new Error("fail") });

    render(<AuthForm />);
    await user.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com",
    );
    await user.type(screen.getByLabelText("パスワード"), "password");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(await screen.findByText("fail")).toBeInTheDocument();
  });

  it("shows generic message for unknown error", async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({ error: { message: "fail" } });

    render(<AuthForm />);
    await user.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com",
    );
    await user.type(screen.getByLabelText("パスワード"), "password");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(
      await screen.findByText("認証エラーが発生しました。"),
    ).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(<AuthForm />);
    await user.click(screen.getByRole("button", { name: "ログイン" }));
    expect(
      await screen.findByText("メールアドレスを入力してください"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("パスワードを入力してください"),
    ).toBeInTheDocument();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("validates email format", async () => {
    const user = userEvent.setup();
    render(<AuthForm />);
    await user.type(screen.getByLabelText("メールアドレス"), "invalid");
    await user.type(screen.getByLabelText("パスワード"), "abcdef");
    await user.click(screen.getByRole("button", { name: "ログイン" }));
    expect(
      await screen.findByText("正しいメールアドレスを入力してください"),
    ).toBeInTheDocument();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("renders forgot password link", () => {
    render(<AuthForm />);
    const link = screen.getByRole("link", { name: "パスワードを忘れた場合" });
    expect(link).toHaveAttribute("href", "/forgot-password");
  });
});
