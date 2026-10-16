# Registro mágico em tela inteira

A versão 3.0 substitui o enquadramento compartilhado por sete protagonistas, poses e superfícies de leitura. A cena principal usa os protagonistas fornecidos por capítulo (pergaminho em II, tinteiro em III, corredor em IV, espelho em V, esfera/ampulheta em VI e mesa/caixa em VII); o livro articulado permanece no acervo compacto. Veja [direção dos capítulos](DIRECAO-CAPITULOS.md) para composição, materiais, recursos e validação. Os contratos de dados e proteções abaixo continuam em vigor.

A entrada principal da carta e de “Meu personagem” abre `/experiencia`. O cenário existente (Three.js, React Three Fiber, GSAP, modelos locais CC0 e iluminação da escrivaninha) preenche o viewport; o formulário convencional continua disponível em `/criar/*` para compatibilidade. Os links de edição da revisão voltam à cena com `?capitulo=I` até `VII`.

A tela inicial prepara o cenário e os materiais sem iniciar movimentos. O clique libera a animação no mesmo Canvas, ou espera a preparação terminar se ocorrer durante o carregamento. Retomada, modo leve e movimento reduzido permanecem disponíveis; aguardar na entrada não grava o cursor nem marca a chegada de IV como vista.

A sequência deriva exclusivamente de `content/admission.ts` e `content/chapters.ts`: 61 perguntas principais, seleção de família e sete confirmações de capítulo. Família, pessoas, objetos, respostas condicionais e oportunidades narrativas reutilizam os editores e contratos atuais. Nenhuma resposta gera fatos automaticamente.

`story.experienceStep` é um cursor opcional no rascunho e no backup completo. Backups antigos continuam válidos. A ficha final exportada não contém estado de interface. Continuar salva respostas e o próximo cursor antes da timeline visual. Perguntas comuns usam 300 ms e o capítulo II reserva 700 ms para a troca do documento; a folha procedural curva de I dura 280 ms. O pergaminho de II não finge ser um livro articulado. Voltar preserva o sentido reverso. GSAP coordena a apresentação; pular conclui uma vez a operação pendente, sem bypass da gravação. Falha de armazenamento mantém a página atual e oferece backup/retry no menu. Restaurar um backup cancela a animação pendente antes de recuperar a página, inclusive quando o personagem mantém o mesmo ID. Revisão e exportação mantêm todas as validações anteriores.

Os campos permanecem em HTML com rótulos, teclado, seleção, edição e contraste. A área de escrita rola quando perguntas ou editores são extensos. `visualViewport` ajusta altura e posição quando o teclado aparece. O layout usa viewport CSS, sem exigir a API fullscreen. Movimento reduzido e cenário leve permanecem disponíveis; a ilustração leve também cobre a tela.

Os modelos e créditos Poly Haven permanecem intactos. O álbum preserva a geometria flexível do livro. Apenas respostas confirmadas geram uma textura local pequena, descartada ao mudar; dados do jogador nunca são enviados ao servidor. Renderer sob demanda, sombras 512 e DPR até 1.5 mantêm o orçamento anterior.

Validação: testes de persistência/compatibilidade de esquema, fluxo completo desktop/mobile, edição, validação obrigatória, retomada, backup, animação interrompida, saída, largura de tela e acessibilidade automatizada. O teste de viewport com teclado usa redimensionamento, pois a emulação Chromium não abre um teclado virtual de aparelho real.

A orientação de nascimento usa a idade já calculada em 1º de setembro de 1890 e destaca a idade habitual de onze anos. Nenhuma restrição etária adicional foi adicionada; datas excepcionais continuam aceitas para acordo com o Mestre.
