import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { PlayerProvider } from "@/components/narrative/PlayerProvider";
export const metadata: Metadata = {
  title: "Carta para Hogwarts · 1890",
  description:
    "Toda grande história começa com alguém. Escreva o início da sua.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        <header className="site-header">
          <Link href="/" className="brand">
            <span aria-hidden="true">✦</span> Carta para Hogwarts{" "}
            <small>1890</small>
          </Link>
          <nav className="header-nav" aria-label="Navegação principal">
            <Link href="/experiencia">Meu personagem</Link>
            <Link href="/mestre">Arquivo do Mestre</Link>
          </nav>
        </header>
        <PlayerProvider>{children}</PlayerProvider>
        <footer>
          Personagens fictícios · Dados neste navegador · Projeto de fãs, sem
          afiliação oficial
        </footer>
      </body>
    </html>
  );
}
