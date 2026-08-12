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
  await expect(page.getByRole("link", { name: "Como funciona" })).toHaveAttribute(
    "href",
    "/#como-funciona",
  );
  await expect(page.locator("#como-funciona")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Cinema que acontece" }),
  ).toBeVisible();
});
