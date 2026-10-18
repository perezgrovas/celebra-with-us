import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { configSchema, defaultConfig } from "../lib/config";
import { videoEmbed, layerSchema } from "../lib/design";
import fonts from "../lib/font-catalog.json";
import { doodleCategories, doodleSvg } from "../lib/doodles";
test("legacy saved settings gain editor defaults without losing content", () => {
  const { design, ...legacy } = defaultConfig;
  void design;
  legacy.sections = legacy.sections.filter((s) => s.key !== "video");
  const parsed = configSchema.parse(legacy);
  assert.equal(parsed.content.story, legacy.content.story);
  assert.equal(parsed.design.galleryFit, "contain");
  assert.deepEqual(parsed.design.layers, []);
  assert.equal(parsed.sections.length, 11);
});
test("embeds only known video hosts and valid IDs", () => {
  assert.equal(
    videoEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  );
  assert.equal(
    videoEmbed("https://vimeo.com/12345"),
    "https://player.vimeo.com/video/12345",
  );
  assert.equal(
    videoEmbed("https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ"),
    null,
  );
  assert.equal(videoEmbed("javascript:alert(1)"), null);
  assert.equal(
    configSchema.safeParse({
      ...defaultConfig,
      design: {
        ...defaultConfig.design,
        video: {
          ...defaultConfig.design.video,
          url: "https://evil.test/embed",
        },
      },
    }).success,
    false,
  );
});
test("layer positions remain normalized and mobile can differ", () => {
  const layer = layerSchema.parse({
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    section: "hero",
    kind: "doodle",
    position: { x: 20, y: 20, width: 25 },
    mobile: { x: 80, y: 15, width: 30 },
  });
  assert.notDeepEqual(layer.position, layer.mobile);
  assert.equal(
    layerSchema.safeParse({ ...layer, position: { x: 101, y: 20, width: 25 } })
      .success,
    false,
  );
});
test("48 bundled fonts have matching files, license notices and four categories", async () => {
  assert.equal(fonts.length, 48);
  for (const category of new Set(fonts.map((f) => f.category)))
    assert.equal(fonts.filter((f) => f.category === category).length, 12);
  assert.equal(new Set(fonts.map((f) => f.category)).size, 4);
  for (const font of fonts) {
    const bytes = await readFile(
      new URL("../public" + font.url, import.meta.url),
    );
    assert.equal(createHash("sha256").update(bytes).digest("hex"), font.sha256);
    const license = await readFile(
      new URL("../licenses/fonts/" + font.id + ".txt", import.meta.url),
      "utf8",
    );
    assert.match(license, /SIL OPEN FONT LICENSE|Apache License/i);
    assert.ok(bytes.length > 500);
  }
});
test("original doodles exist for all requested event categories", () => {
  assert.equal(Object.keys(doodleCategories).length, 6);
  for (const ids of Object.values(doodleCategories)) {
    assert.ok(ids.length >= 6);
    for (const id of ids) assert.match(doodleSvg(id), /^data:image\/svg\+xml,/);
  }
});
