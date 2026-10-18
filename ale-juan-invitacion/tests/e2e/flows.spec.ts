import { test, expect } from "@playwright/test";
test.beforeEach(async ({ request }) => {
  await request.post("http://127.0.0.1:54321/__reset");
});
const token = "55555555-5555-4555-8555-555555555555";
async function login(page: import("@playwright/test").Page) {
  await page.goto("/admin");
  await page.getByLabel("Correo electrónico").fill("ale@example.test");
  await page.getByLabel("Contraseña", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Entrar a mi invitación" }).click();
  await expect(
    page.getByRole("heading", { name: "Hagámosla suya." }),
  ).toBeVisible();
}
async function noOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() =>
    Array.from(document.querySelectorAll("body *"))
      .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1)
      .map((e) => ({
        tag: e.tagName,
        cls: e.className,
        right: e.getBoundingClientRect().right,
      }))
      .slice(0, 10),
  );
  expect(overflow).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}
test("admin desktop: authentication, draft save, section order, guests and preview", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  await page.getByLabel("Nombre de la novia").fill("Alejandra");
  await expect(page.getByText("Cambios sin guardar")).toBeVisible();
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Borrador guardado");
  await page.reload();
  await expect(page.getByLabel("Nombre de la novia")).toHaveValue("Alejandra");
  await page.getByRole("button", { name: "Secciones", exact: true }).click();
  await page
    .getByRole("button", { name: "Bajar Portada", exact: true })
    .click();
  await expect(page.locator(".phone [data-section]").first()).toHaveAttribute(
    "data-section",
    "countdown",
  );
  await page.getByRole("button", { name: "Invitados y RSVP" }).click();
  await page.getByLabel("Nombre de la invitación").fill("Sofi y Fer");
  await page.getByRole("button", { name: "Crear invitación" }).click();
  await expect(
    page.getByRole("heading", { name: "Sofi y Fer", exact: true }),
  ).toBeVisible();
  await noOverflow(page);
  await page.screenshot({
    path: "test-results/admin-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("admin mobile: navigation and preview are accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.getByRole("button", { name: "Abrir navegación" }).click();
  await page.getByRole("button", { name: "Colores y tipografías" }).click();
  await expect(
    page.getByRole("heading", { name: "Tipografías", exact: true }),
  ).toBeVisible();
  await noOverflow(page);
  await page.getByRole("button", { name: "Vista previa" }).click();
  await expect(page.locator(".phone")).toBeVisible();
  await page.getByRole("button", { name: "Cerrar vista previa" }).click();
  await page.screenshot({
    path: "test-results/admin-mobile.png",
    fullPage: true,
  });
});
test("personalized mobile invitation: RSVP persists and no hydration errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/i/${token}`);
  await expect(
    page.getByText("Con mucho cariño para Dany y acompañante"),
  ).toBeVisible();
  await page.locator("#rsvp select").nth(0).selectOption("attending");
  await page.locator("#rsvp select").nth(1).selectOption("declined");
  await page.getByRole("button", { name: "Guardar confirmación" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Tu respuesta quedó guardada",
  );
  await page.reload();
  await expect(page.locator("#rsvp select").nth(0)).toHaveValue("attending");
  await expect(page.locator("#rsvp select").nth(1)).toHaveValue("declined");
  await noOverflow(page);
  await page.screenshot({
    path: "test-results/invitation-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("invalid invite token has a helpful 404", async ({ page }) => {
  await page.goto("/i/invalid");
  await expect(
    page.getByRole("heading", { name: "No encontramos tu invitación" }),
  ).toBeVisible();
});

test("photos, backgrounds and custom fonts survive reload", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  await page.getByRole("button", { name: "Fotos y archivos" }).click();
  const photo = await page.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 20;
    c.height = 20;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#819574";
    ctx.fillRect(0, 0, 20, 20);
    return c.toDataURL("image/png").split(",")[1];
  });
  await page.locator("input[type=file]").setInputFiles({
    name: "couple.png",
    mimeType: "image/png",
    buffer: Buffer.from(photo, "base64"),
  });
  await expect(page.getByText("couple.webp", { exact: true })).toBeVisible();
  await page.getByLabel("Incluir en galería").check();
  await page.getByLabel("Tipo de archivo").selectOption("background");
  await page.locator("input[type=file]").setInputFiles({
    name: "texture.png",
    mimeType: "image/png",
    buffer: Buffer.from(photo, "base64"),
  });
  await expect(page.getByText("texture.png", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Usar como fondo" }).click();
  await page.getByLabel("Tipo de archivo").selectOption("font");
  await page
    .locator("input[type=file]")
    .setInputFiles("tests/fixtures/test-font.ttf");
  await expect(page.getByText("test-font.ttf", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Colores y tipografías" }).click();
  await page
    .getByLabel("Títulos", { exact: false })
    .first()
    .selectOption({ label: "test-font.ttf" });
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Borrador guardado");
  await page.reload();
  await page.getByRole("button", { name: "Colores y tipografías" }).click();
  await expect(page.getByLabel("Imagen de fondo")).not.toHaveValue("");
  await expect(
    page.getByLabel("Títulos", { exact: false }).first(),
  ).toHaveValue(/Wedding_/);
  await page.getByRole("button", { name: "Fotos y archivos" }).click();
  await expect(page.getByLabel("Incluir en galería")).toBeChecked();
});

test("confirmed guests can be assigned to a table and the assignment persists", async ({
  page,
  request,
}) => {
  await request.post("http://127.0.0.1:54321/rest/v1/rpc/submit_rsvp", {
    data: {
      invite_token: token,
      answers: [
        {
          id: "66666666-6666-4666-8666-666666666666",
          status: "attending",
          dietary: "",
          companion_name: "",
        },
        {
          id: "77777777-7777-4777-8777-777777777777",
          status: "declined",
          dietary: "",
          companion_name: "",
        },
      ],
    },
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.getByRole("button", { name: "Abrir navegación" }).click();
  await page.getByRole("button", { name: "Mesas", exact: true }).click();
  await page.getByLabel("Nombre de la mesa").fill("Amigos");
  await page.getByRole("button", { name: "Crear mesa" }).click();
  await expect(
    page.getByRole("heading", { name: "Amigos", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Mesa de Dany").selectOption({ label: "Amigos" });
  await expect(page.getByRole("status")).toContainText("actualizada");
  await page.reload();
  await page.getByRole("button", { name: "Abrir navegación" }).click();
  await page.getByRole("button", { name: "Mesas", exact: true }).click();
  await expect(page.getByLabel("Mesa de Dany")).not.toHaveValue("");
  await noOverflow(page);
});
