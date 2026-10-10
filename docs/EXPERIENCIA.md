# Registro mágico em tela inteira

A entrada principal da carta e de “Meu personagem” abre `/experiencia`. O cenário existente (Three.js, React Three Fiber, GSAP, modelos locais CC0 e iluminação da escrivaninha) preenche o viewport; o formulário convencional continua disponível em `/criar/*` para compatibilidade. Os links de edição da revisão voltam à cena com `?capitulo=I` até `VII`.

A sequência deriva exclusivamente de `content/admission.ts` e `content/chapters.ts`: 61 perguntas principais, seleção de família e sete confirmações de capítulo. Família, pessoas, objetos, respostas condicionais e oportunidades narrativas reutilizam os editores e contratos atuais. Nenhuma resposta gera fatos automaticamente.

`story.experienceStep` é um cursor opcional no rascunho e no backup completo. Backups antigos continuam válidos. A ficha final exportada não contém estado de interface. Continuar salva respostas e o próximo cursor antes dos efeitos de brilho, absorção, escrita no livro, folha e câmera. O temporizador só controla a apresentação; pular animações conclui a transição pendente. Falha de armazenamento mantém a página atual e oferece backup/retry no menu. Revisão e exportação mantêm todas as validações anteriores.

Os campos permanecem em HTML com rótulos, teclado, seleção, edição e contraste. A área de escrita rola quando perguntas ou editores são extensos. `visualViewport` ajusta altura e posição quando o teclado aparece. O layout usa viewport CSS, sem exigir a API fullscreen. Movimento reduzido e cenário leve permanecem disponíveis; a ilustração leve também cobre a tela.

Os modelos e créditos Poly Haven permanecem intactos. O livro compartilhado reutiliza o álbum original. Apenas respostas confirmadas geram uma textura local pequena, descartada ao mudar; dados do jogador nunca são enviados ao servidor. Renderer sob demanda, sombras 512 e DPR até 1.5 mantêm o orçamento anterior.

Validação: testes de persistência/compatibilidade de esquema, fluxo completo desktop/mobile, edição, validação obrigatória, retomada, backup, animação interrompida, saída, largura de tela e acessibilidade automatizada. O teste de viewport com teclado usa redimensionamento, pois a emulação Chromium não abre um teclado virtual de aparelho real.
