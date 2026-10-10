import { expect, it } from "vitest";
import { storySchema, buildExport } from "../src/lib/story";
import { fixture } from "./fixtures";
it("backups antigos continuam válidos e o cursor não altera a ficha exportada", () => {
  const { draft, story } = fixture();
  expect(storySchema.parse(story).experienceStep).toBeUndefined();
  const resumed = storySchema.parse({ ...story, experienceStep: "VI04" });
  expect(resumed.experienceStep).toBe("VI04");
  expect(buildExport(draft, resumed)).not.toHaveProperty("experienceStep");
  expect(buildExport(draft, resumed).answers).toEqual(
    buildExport(draft, story).answers,
  );
});
