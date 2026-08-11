import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthSession, UserRole } from "@/modules/auth";

const mocks = vi.hoisted(() => ({
  getRoleHomePath: vi.fn(),
  getSession: vi.fn(),
  headers: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/modules/auth", () => ({
  getRoleHomePath: mocks.getRoleHomePath,
  getSession: mocks.getSession,
}));

import LoginPage from "@/app/login/page";
import { dynamic as loginPageDynamic } from "@/app/login/page";
import { AppHeader } from "@/components/app-header";
import { LoginForm } from "@/modules/auth/login-form";
import { LogoutButton } from "@/modules/auth/logout-button";

function sessionFor(role: UserRole): AuthSession {
  return {
    session: {
      expiresAt: new Date("2026-08-11T12:00:00.000Z"),
      id: "session-id",
    },
    user: {
      email: "user@example.com",
      id: "user-id",
      image: null,
      name: "Usuário de teste",
      role,
    },
  };
}

type NavigationElement = ReactElement<{
  children?: ReactNode;
  href?: string;
}>;

function isNavigationElement(node: ReactNode): node is NavigationElement {
  return isValidElement<NavigationElement["props"]>(node);
}

function navigationItems(header: ReactElement) {
  const headerChildren = Children.toArray(
    (header as NavigationElement).props.children,
  );
  const navigation = headerChildren.find(
    (child): child is NavigationElement =>
      isNavigationElement(child) && child.type === "nav",
  );

  if (!navigation) {
    throw new Error("Expected the global navigation element.");
  }

  return Children.toArray(navigation.props.children).filter(isNavigationElement);
}

function links(header: ReactElement) {
  return navigationItems(header)
    .filter((item) => typeof item.props.href === "string")
    .map((item) => ({ href: item.props.href, label: item.props.children }));
}

function hasLogoutButton(header: ReactElement) {
  return navigationItems(header).some((item) => item.type === LogoutButton);
}

function containsElementType(node: ReactNode, type: ReactElement["type"]): boolean {
  if (!isValidElement(node)) {
    return false;
  }

  if (node.type === type) {
    return true;
  }

  return Children.toArray(
    (node as ReactElement<{ children?: ReactNode }>).props.children,
  ).some((child) => containsElementType(child, type));
}

describe("global authentication navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers({ cookie: "session=test" }));
  });

  it("shows Entrar when there is no session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const header = await AppHeader();

    expect(links(header)).toEqual([
      { href: "/", label: "Programação" },
      { href: "/login", label: "Entrar" },
    ]);
    expect(hasLogoutButton(header)).toBe(false);
  });

  it.each([
    ["CUSTOMER", "/tickets", "Meus ingressos"],
    ["ORGANIZER", "/organizer", "Área do organizador"],
    ["GATE", "/gate", "Portaria"],
  ] as const)("shows the %s destination and logout", async (role, href, label) => {
    mocks.getSession.mockResolvedValue(sessionFor(role));

    const header = await AppHeader();

    expect(links(header)).toEqual([
      { href: "/", label: "Programação" },
      { href, label },
    ]);
    expect(hasLogoutButton(header)).toBe(true);
  });

  it.each([
    ["CUSTOMER", "/"],
    ["ORGANIZER", "/organizer"],
    ["GATE", "/gate"],
  ] as const)("redirects an authenticated %s away from /login", async (role, destination) => {
    mocks.getSession.mockResolvedValue(sessionFor(role));
    mocks.getRoleHomePath.mockReturnValue(destination);
    mocks.redirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });

    await expect(LoginPage()).rejects.toThrow(`redirect:${destination}`);
    expect(mocks.getRoleHomePath).toHaveBeenCalledWith(role);
  });

  it("renders the login form when there is no session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const loginPage = await LoginPage();

    expect(containsElementType(loginPage, LoginForm)).toBe(true);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("forces per-request rendering for the server session check", () => {
    expect(loginPageDynamic).toBe("force-dynamic");
  });
});
