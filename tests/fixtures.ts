import { chapterIds } from "../src/content/chapters";
import { createDraft } from "../src/lib/draft";
import { createStory, type Hook } from "../src/lib/story";
export function fixture(name = "Eleanor Whitmore") {
  const draft = createDraft();
  Object.assign(draft.admission, {
    fullName: name,
    birthDate: "1879-03-15",
    birthPlace: "Edimburgo",
    residence: "Yorkshire",
  });
  const story = createStory(draft.id);
  story.chaptersReviewed = [...chapterIds];
  story.answers.III01 = { value: "nao", status: "answered" };
  return { draft, story };
}
export const hook: Hook = {
  id: "hook_test",
  sourceQuestionId: "II-A",
  title: "Cartas antigas",
  kind: "familia",
  confirmedFacts: ["Uma carta chegava no inverno."],
  characterBeliefs: ["Talvez fosse de um amigo."],
  unansweredQuestion: "Quem enviava?",
  permission: "explanation",
  exploreInCampaign: "yes",
  playerInterest: "high",
  specificConstraints: ["Não tornar o parente um vilão."],
};
