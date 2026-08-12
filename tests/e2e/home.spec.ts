import { expect, test } from "@playwright/test";

test("exibe o hero, a programação e o caminho de como funciona", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Projeção — sessões de cinema");
  await expect(
    page.getByRole("heading", { name: "Sessões para sair da tela." }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Sessões em cartaz" }),
  ).toBeVisible();
  await expect(page.getByLabel("Navegação do rodapé").getByRole("link", { name: "Como funciona" })).toHaveAttribute(
    "href",
    "/#como-funciona",
  );
  await expect(page.locator("#como-funciona")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Cinema que acontece" }),
  ).toBeVisible();
});

test("mantém a home íntegra e abre o drawer móvel sobre o conteúdo", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"), "Cenário exclusivo do viewport móvel.");
  await page.goto("/");

  expect(await page.locator("html").evaluate((element) =>
    element.scrollWidth === window.innerWidth,
  )).toBe(true);
  const menuButton = page.getByRole("button", { name: "Abrir menu" });
  await expect(menuButton).toBeVisible();

  await menuButton.click();
  const drawer = page.getByRole("dialog", { name: "Navegação móvel" });
  await expect(drawer.getByRole("button", { name: "Fechar menu" })).toBeFocused();
  await expect(drawer).toHaveClass(/translate-x-0/);
  await expect(page.getByRole("button", { name: "Fechar menu" }).first()).toHaveAttribute(
    "aria-expanded",
    "true",
  );

  await page.keyboard.press("Escape");
  await expect(menuButton).toHaveAttribute(
    "aria-expanded",
    "false",
  );

  await menuButton.click();
  await page.locator(".z-50").click({ position: { x: 12, y: 100 } });
  await expect(page.getByRole("button", { name: "Abrir menu" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

test("restaura a navegação desktop acima de 500px", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-after-mobile", "Cenário exclusivo de 501px.");
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Abrir menu" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
  expect(await page.locator("html").evaluate((element) =>
    element.scrollWidth === window.innerWidth,
  )).toBe(true);
});
