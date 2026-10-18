import { test } from "node:test";
import assert from "node:assert/strict";
import {
  configSchema,
  defaultConfig,
  eventInstant,
  formatDate,
} from "../lib/config";
test("event instant follows the configured timezone", () => {
  assert.equal(eventInstant(defaultConfig), "2027-03-06T22:00:00.000Z");
  assert.equal(
    eventInstant({
      ...defaultConfig,
      couple: { ...defaultConfig.couple, timezone: "America/New_York" },
    }),
    "2027-03-06T21:00:00.000Z",
  );
  assert.match(formatDate(defaultConfig), /6 de marzo de 2027/);
});
test("rejects unsafe links and malformed section lists", () => {
  assert.equal(
    configSchema.safeParse({
      ...defaultConfig,
      content: { ...defaultConfig.content, mapUrl: "javascript:alert(1)" },
    }).success,
    false,
  );
  assert.equal(
    configSchema.safeParse({
      ...defaultConfig,
      sections: Array(11).fill({ key: "hero", enabled: true }),
    }).success,
    false,
  );
  assert.equal(
    configSchema.safeParse({
      ...defaultConfig,
      couple: { ...defaultConfig.couple, timezone: "wrong" },
    }).success,
    false,
  );
});
