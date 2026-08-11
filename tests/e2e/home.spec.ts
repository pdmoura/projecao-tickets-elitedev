import { expect, test } from "@playwright/test";

test("exibe o shell inicial da Projeção", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Projeção — sessões de cinema");
  await expect(
    page.getByRole("heading", { name: "Sessões que merecem sair da tela." }),
  ).toBeVisible();
});
