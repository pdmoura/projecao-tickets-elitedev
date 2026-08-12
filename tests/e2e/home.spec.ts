import { expect, test } from "@playwright/test";

test("exibe a programação e permite iniciar a seleção de assentos", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Projeção — sessões de cinema");
  await expect(
    page.getByRole("heading", { name: "Sessões para sair da tela." }),
  ).toBeVisible();
  await page.getByRole("link", { name: /A Viagem de Chihiro/ }).click();

  const seat = page.getByRole("button", { name: "Assento A1, disponível" });
  await expect(seat).toBeVisible();
  await seat.click();
  await expect(
    page.getByRole("button", { name: "Assento A1, selecionado" }),
  ).toBeVisible();
});
