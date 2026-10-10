import "fake-indexeddb/auto";
import { expect, it } from "vitest";
import { createStory } from "../src/lib/story";
import { loadStory, saveStory, masterStore } from "../src/lib/local-store";
import { emptyMaster } from "../src/lib/master";
it("isola histórias por personagem e o Arquivo do Mestre do jogador", async () => {
  const first = createStory("char_one");
  first.answers.II02 = { value: "Uma casa alegre", status: "answered" };
  await saveStory(first);
  const second = createStory("char_two");
  await saveStory(second);
  expect(await loadStory("char_one")).toEqual(first);
  const master = emptyMaster();
  await masterStore.write("archive", master);
  expect(await masterStore.read("archive")).toEqual(master);
  expect(await loadStory("archive")).toBeNull();
});
