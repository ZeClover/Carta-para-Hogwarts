import { notFound } from "next/navigation";
import { chapterIds, type ChapterId } from "@/content/chapters";
import { Chapter } from "@/components/narrative/Chapter";
export function generateStaticParams() {
  return chapterIds.filter((id) => id !== "I").map((chapter) => ({ chapter }));
}
export default async function ChapterPage({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter } = await params;
  if (!chapterIds.includes(chapter as ChapterId) || chapter === "I") notFound();
  return (
    <main id="conteudo" className="document-layout">
      <Chapter chapter={chapter as ChapterId} />
    </main>
  );
}
