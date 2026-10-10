import { CinematicExperience } from "@/components/narrative/CinematicExperience";
import { chapterIds } from "@/content/chapters";
export default async function ExperiencePage({
  searchParams,
}: {
  searchParams: Promise<{ capitulo?: string }>;
}) {
  const { capitulo } = await searchParams;
  const chapter = chapterIds.find((id) => id === capitulo);
  return <CinematicExperience chapter={chapter} />;
}
