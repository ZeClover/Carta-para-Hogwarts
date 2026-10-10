import Link from "next/link";
import { chapters, chapterIds, type ChapterId } from "@/content/chapters";
export function ChapterNav({
  current,
  reviewed = [],
}: {
  current: ChapterId | "revisao";
  reviewed?: string[];
}) {
  return (
    <aside className="chapter-sidebar">
      <p className="eyebrow">Hogwarts · 1890</p>
      <h2>Sua história</h2>
      <p>Você define os fatos. O futuro continua aberto.</p>
      <nav aria-label="Capítulos">
        <ol className="chapter-list">
          {chapterIds.map((id) => (
            <li key={id} aria-current={current === id ? "step" : undefined}>
              <Link href={`/criar/${id}`}>
                <span>{id}</span>
                {chapters[id].title}
              </Link>
              {reviewed.includes(id) && <small>Revisado</small>}
            </li>
          ))}
        </ol>
        <Link
          href="/revisao"
          aria-current={current === "revisao" ? "page" : undefined}
        >
          Revisão final →
        </Link>
      </nav>
      <Link href="/">← Voltar à carta</Link>
    </aside>
  );
}
