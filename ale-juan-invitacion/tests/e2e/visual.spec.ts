import { test, expect, type Page } from "@playwright/test";
async function login(page: Page) {
  await page.goto("/admin");
  await page.getByLabel("Correo electrónico").fill("ale@example.test");
  await page.getByLabel("Contraseña", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Entrar a mi invitación" }).click();
  await expect(page.locator(".visual-editor")).toBeVisible();
}
async function tool(page: Page, name: string) {
  await page
    .locator(".tool-icons")
    .getByRole("button", { name, exact: true })
    .click();
}
test.beforeEach(async ({ request }) => {
  await request.post("http://127.0.0.1:54321/__reset");
});
test("visual layouts, free text, doodles, mobile placement and persisted published output", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1600, height: 1000 });
  await login(page);
  await page.getByRole("button", { name: "Tarjeta", exact: true }).click();
  await expect(
    page.locator(".canvas-device [data-section=hero]"),
  ).toHaveAttribute("data-layout", "card");
  await tool(page, "Doodles");
  await page
    .getByRole("button", { name: "Agregar Anillos", exact: true })
    .click();
  await expect(page.locator(".canvas-device .design-layer")).toHaveCount(1);
  await page.getByLabel("Posición horizontal", { exact: true }).fill("30");
  await page.getByLabel("Posición vertical", { exact: true }).fill("20");
  const shape = page.locator(".canvas-device .design-layer");
  const bounds = await shape.boundingBox();
  await page.mouse.move(
    bounds!.x + bounds!.width / 2,
    bounds!.y + bounds!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds!.x + bounds!.width / 2 + 40,
    bounds!.y + bounds!.height / 2 + 12,
    { steps: 6 },
  );
  await page.mouse.up();
  await expect(
    page.getByLabel("Posición horizontal", { exact: true }),
  ).not.toHaveValue("30");
  await tool(page, "Letras");
  await page.getByRole("button", { name: "Agregar texto libre" }).click();
  await page.getByLabel("Texto del elemento").fill("¡Nos vemos en la pista!");
  await page.getByRole("button", { name: /Aa ·/ }).first().click();
  await page.getByRole("button", { name: /Great Vibes/ }).click();
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Borrador guardado");
  await page.reload();
  await expect(page.locator(".canvas-device .design-layer")).toHaveCount(2);
  await expect(page.locator(".canvas-device .layer-text")).toContainText(
    "¡Nos vemos en la pista!",
  );
  await page.getByRole("button", { name: "Vista de escritorio" }).click();
  await expect(page.locator(".canvas-device")).toHaveClass(/desktop/);
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("publicada");
  await page.getByRole("button", { name: "Vista previa", exact: true }).click();
  await expect(page.locator(".guest-view-open .editable-item")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Volver a editar" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Volver a editar" }).click();
  await page.screenshot({ path: "test-results/visual-editor-desktop.png" });
  await page.goto("/");
  await expect(page.locator(".layer-text")).toContainText(
    "¡Nos vemos en la pista!",
  );
  expect(errors).toEqual([]);
});
test("palettes, custom palette, all event doodle groups and undo", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  await tool(page, "Colores");
  await page
    .getByRole("button", { name: "Azul porcelana", exact: true })
    .click();
  await page.getByRole("button", { name: "Crea tu paleta de color" }).click();
  await page.getByLabel("Nombre de la paleta").fill("Nuestra mezcla");
  await page.getByRole("button", { name: "Guardar mi paleta" }).click();
  await expect(
    page.getByRole("button", { name: "Nuestra mezcla", exact: true }),
  ).toBeVisible();
  await tool(page, "Doodles");
  await page.getByLabel("Categoría de doodles").selectOption("Conciertos");
  await page
    .getByRole("button", { name: "Agregar Micrófono", exact: true })
    .click();
  await expect(page.locator(".canvas-device .design-layer")).toHaveCount(1);
  await page.getByRole("button", { name: "Deshacer", exact: true }).click();
  await expect(page.locator(".canvas-device .design-layer")).toHaveCount(0);
  await page.getByRole("button", { name: "Rehacer", exact: true }).click();
  await expect(page.locator(".canvas-device .design-layer")).toHaveCount(1);
});
test("mobile editor, optional video section and guest preview", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await tool(page, "Video");
  await page
    .getByLabel("Enlace del video", { exact: true })
    .fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  await page.getByRole("button", { name: "Mostrar sección de video" }).click();
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Borrador guardado");
  await page.reload();
  await tool(page, "Video");
  await expect(
    page.getByLabel("Enlace del video", { exact: true }),
  ).toHaveValue("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  await page.getByRole("button", { name: "Vista previa", exact: true }).click();
  await expect(page.locator(".guest-view-open")).toBeVisible();
  await page.screenshot({ path: "test-results/visual-editor-mobile.png" });
  await page.getByRole("button", { name: "Volver a editar" }).click();
  await page
    .getByRole("button", { name: "Ocultar video", exact: true })
    .click();
  await expect(page.locator(".canvas-device [data-section=video]")).toHaveCount(
    0,
  );
});

test("bundled fonts load, photos use masks and a real carousel, section backgrounds reset", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  await tool(page, "Fotos");
  const image = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 30;
    canvas.height = 50;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#abc19a";
    context.fillRect(0, 0, 30, 50);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  for (const name of ["one.png", "two.png"]) {
    await page
      .getByLabel("Subir foto al diseño", { exact: true })
      .setInputFiles({
        name,
        mimeType: "image/png",
        buffer: Buffer.from(image, "base64"),
      });
    await expect(
      page.getByRole("button", {
        name: `Usar ${name.replace(".png", ".webp")}`,
        exact: true,
      }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Máscara Arco", exact: true }).click();
  await expect(
    page.locator(
      ".canvas-device [data-section=hero] .section-photo [data-mask]",
    ),
  ).toHaveAttribute("data-mask", "arch");
  await page.getByLabel("Sección a diseñar").selectOption("gallery");
  for (const name of ["one.webp", "two.webp"])
    await page
      .locator(".gallery-select")
      .filter({ hasText: name })
      .locator("input[type=checkbox]")
      .check();
  await expect(
    page.locator(".canvas-device [data-section=gallery] .photo-slide"),
  ).toHaveCount(2);
  await expect(
    page.locator(".canvas-device [data-section=gallery] .mode-carousel"),
  ).toHaveCount(1);
  await tool(page, "Fondos");
  await page
    .getByLabel("Fondo de esta sección", { exact: true })
    .fill("#ffdddd");
  await expect(page.locator(".canvas-device [data-section=gallery]")).toHaveCSS(
    "background-color",
    "rgb(255, 221, 221)",
  );
  await page
    .getByRole("button", { name: "Usar fondo general", exact: true })
    .click();
  await expect(page.locator(".canvas-device [data-section=gallery]")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  const { readFile } = await import("node:fs/promises");
  const fonts = JSON.parse(await readFile("lib/font-catalog.json", "utf8")) as {
    family: string;
    url: string;
  }[];
  const results = await page.evaluate(
    async (fonts) =>
      Promise.all(
        fonts.map(async (f) => {
          try {
            await new FontFace(
              f.family,
              `url(${JSON.stringify(f.url)})`,
            ).load();
            return { family: f.family, loaded: true };
          } catch {
            return { family: f.family, loaded: false };
          }
        }),
      ),
    fonts,
  );
  expect(results.every((f) => f.loaded)).toBe(true);
});
