import { Letter } from "@/components/Letter";
export default function Home() {
  return (
    <main id="conteudo" className="landing">
      <div className="landing-copy">
        <p className="eyebrow">Hogwarts, setembro de 1890</p>
        <h1>
          Há uma carta
          <br />
          com o seu nome.
        </h1>
        <p>
          Antes das torres, dos corredores e de tudo o que virá, existe uma
          história. A sua.
        </p>
        <p className="fine-print">
          Comece pelo Registro de Admissão. Você pode parar e continuar depois
          neste navegador.
        </p>
      </div>
      <Letter />
    </main>
  );
}
