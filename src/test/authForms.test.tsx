import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

// Mock auth client
const authMocks = vi.hoisted(() => ({
  signIn: {
    username: vi.fn(),
  },
  resetPassword: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      username: authMocks.signIn.username,
    },
    resetPassword: authMocks.resetPassword,
  },
}));

// Mock next/navigation
const routerMocks = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerMocks.replace }),
  useSearchParams: () => new URLSearchParams("token=test-token-123"),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock global fetch for ForgotPasswordForm
global.fetch = vi.fn();

describe("LoginForm", () => {
  beforeEach(() => {
    authMocks.signIn.username.mockReset();
    routerMocks.replace.mockReset();
  });

  it("renders username and password fields", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows forgot password link", () => {
    render(<LoginForm />);
    expect(screen.getByRole("link", { name: /forgot your password/i })).toBeInTheDocument();
  });

  it("redirects to dashboard on successful login", async () => {
    authMocks.signIn.username.mockResolvedValue({ error: null, data: {} });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/username/i), "admin");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(routerMocks.replace).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error message on failed login", async () => {
    authMocks.signIn.username.mockResolvedValue({
      error: { message: "Invalid username or password" },
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/username/i), "wronguser");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
    });
  });
});

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.mocked(global.fetch).mockReset();
  });

  it("renders username field", () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("shows generic success message after submit regardless of outcome", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response);
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText(/username/i), "admin");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/if that username exists/i),
      ).toBeInTheDocument();
    });
  });

  it("shows success when fetch returns non-ok response (enumeration prevention)", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: false, status: 404 } as Response);
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText(/username/i), "someuser");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/if that username exists/i),
      ).toBeInTheDocument();
    });
  });
});

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    authMocks.resetPassword.mockReset();
    routerMocks.replace.mockReset();
  });

  it("renders password fields when token is present", () => {
    render(<ResetPasswordForm />);
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("shows error for mismatched passwords", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText(/new password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "different123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("shows error when reset fails", async () => {
    authMocks.resetPassword.mockResolvedValue({
      error: { message: "Token expired" },
    });
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText(/new password/i), "newpassword123");
    await user.type(screen.getByLabelText(/confirm password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/token expired/i)).toBeInTheDocument();
    });
  });
});
