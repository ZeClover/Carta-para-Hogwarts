import type { ChapterId } from "@/content/chapters";
export type SceneKind = ChapterId | "letter" | "final";
export const sceneConfig: Record<
  SceneKind,
  { title: string; caption: string; action: string; result: string }
> = {
  letter: {
    title: "Uma carta à luz de velas",
    caption: "O lacre vermelho espera por você, sobre a escrivaninha.",
    action: "Abrir a carta de Hogwarts",
    result: "O lacre se rompe. A carta está aberta.",
  },
  I: {
    title: "A escrivaninha de admissão",
    caption: "A câmera recua da carta até as folhas do seu registro.",
    action: "Virar a folha do cenário",
    result: "Uma nova folha aparece sobre a mesa.",
  },
  II: {
    title: "O álbum de memórias",
    caption: "Da carta ao álbum: entre as páginas, o mundo de antes.",
    action: "Virar página do álbum",
    result: "Outra página do álbum está aberta.",
  },
  III: {
    title: "Um instante de magia",
    caption: "Uma fotografia, um brilho inesperado, a familiaridade do quarto.",
    action: "Tocar a fotografia",
    result: "A fotografia desperta em um brilho suave.",
  },
  IV: {
    title: "O chamado pela janela",
    caption: "A noite, a janela e uma carta que acaba de chegar.",
    action: "Receber a carta",
    result: "A carta repousa sobre a escrivaninha.",
  },
  V: {
    title: "Diante do espelho",
    caption: "O espelho de latão reflete o quarto e a luz das velas.",
    action: "Iluminar o espelho",
    result: "Uma luz percorre a moldura do espelho.",
  },
  VI: {
    title: "O mapa dos sonhos",
    caption: "Entre estrelas e areia, há tempo para imaginar o futuro.",
    action: "Virar a ampulheta",
    result: "A ampulheta se vira sob o mapa celeste.",
  },
  VII: {
    title: "Cartas e laços",
    caption: "Uma gaveta guarda retratos, lembranças e páginas por escrever.",
    action: "Abrir ou fechar a gaveta",
    result: "A gaveta muda de posição; as fotografias se reorganizam.",
  },
  final: {
    title: "Seu livro pessoal",
    caption: "Seu passado encontra uma capa. O futuro permanece aberto.",
    action: "Selar o livro",
    result: "O livro se fecha com seu lacre. Revise e exporte quando quiser.",
  },
};
