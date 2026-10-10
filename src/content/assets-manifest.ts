import imported from "./generated-assets.json";
/** Sources of shipped CC0 assets and original interactive geometry. */
export const assetsManifest = {
  version: "1.2",
  author: "Carta para Hogwarts — projeto",
  source: "Geometria paramétrica Three.js e ilustração SVG criadas no projeto",
  license:
    "Mesmos termos do código do repositório; geometria própria; modelos importados CC0 identificados separadamente",
  objects: [
    "Escrivaninha",
    "Envelope articulado e lacre",
    "Álbum e páginas",
    "Molduras",
    "Candelabros",
    "Pena e tinteiro",
    "Espelho",
    "Ampulheta",
    "Mapa celeste",
    "Gaveteiro",
    "Livro pessoal com folhas deformáveis",
    "Coruja, pergaminhos e baú procedurais",
    "Relógio de lareira CC0",
  ],
  imported,
  externalSources: [
    {
      title: "Poly Haven",
      sourceUrl: "https://polyhaven.com/models",
      licenseUrl: "https://polyhaven.com/license",
      apiTermsUrl:
        "https://github.com/Poly-Haven/Public-API/blob/master/ToS.md",
      status:
        "Cinco modelos CC0 importados após liberação da rede; arquivos e checksums oficiais conferidos. Texturas até 1K (relógio 512px), GLBs locais.",
    },
  ],
} as const;
