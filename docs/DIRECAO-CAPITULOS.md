# Direção dos capítulos · 3.0

`/` e `/experiencia` compartilham a experiência fullscreen. Não há landing ou clique obrigatório para começar. O provider distingue armazenamento em leitura, registro novo, restaurado e falha de recuperação. Um erro na leitura não cria outro personagem nem permite gravar sobre o registro anterior; a tela oferece recarregar ou importar um backup validado com confirmação explícita.

A abertura é silenciosa e automática para um registro novo: envelope, aba articulada, saída da folha e pose de leitura. O percurso dura 4,6 s no desktop e 3,4 s no celular em modo leve; no 3D, o assentamento final de câmera acrescenta até 0,9/0,55 s. A contagem começa após a apresentação estar disponível. Registros restaurados vão à pergunta salva. Pular abertura é uma ação pontual; pular animações vale para a sessão; reduzir movimento e qualidade são preferências separadas do JSON narrativo. Não há autofocus de input.

## Objetos e composições

| Capítulo | Novo trabalho tridimensional                                                                      | Documento                      |
| -------- | ------------------------------------------------------------------------------------------------- | ------------------------------ |
| I        | Envelope de papel com espessura, dobras, lacre irregular em relevo; aba e folha animadas          | Carta marfim                   |
| II       | Pergaminho original fornecido, hastes metálicas e papel texturizado; aproximação de 1,6 s | Registro de origens em HTML   |
| III      | GLB original de tinteiro com pena de Matthew Collings; gesto abstrato curto                                    | Cartão de relato claro         |
| IV       | Victorian Hallway completo; janela fixa, exterior neutro e correspondência em voo real | Correspondência                |
| V        | Ornate Mirror de Arnold Konrad, moldura original e reflexo arquitetônico planar                  | Pergaminho ao lado             |
| VI       | Esfera armilar de Stellarator como protagonista; ampulheta de Inknot como objeto secundário     | Cartela marfim com tinta azul  |
| VII      | Mesa vitoriana de Faheem Yusuf, gaveta móvel e caixa com fotografias interativas  | Ficha de arquivo e índice HTML |

Os GLBs reconstruídos da entrega 3.0 continuam no acervo; os capítulos II–VII imersivos usam os modelos fornecidos: pergaminho, tinteiro, corredor, espelho, esfera/ampulheta e mesa com caixa. As fontes e adaptações estão nos manifestos próprios. Nenhum requer Blender no navegador. O espelho anterior, preservado no acervo compacto, deriva da `fancy_picture_frame_02`, de Rob Tuytel e Rico Cilliers, CC0, com origem e checksums oficiais registrados. O acervo anterior permanece para as rotas compactas. Livro enciclopédico e gaveteiro Poly Haven também foram pesquisados e baixados com verificação, mas não integrados: o álbum articulado e a gaveta rasa exigem outras silhuetas/estruturas. Não há criaturas, rosto inventado, webcam, varinha, Expresso ou Seleção. A fotografia CC0 do álbum é ambientação anônima, sem determinar a infância.

## Direção e edição

`chapterScenes` declara heróis, recursos críticos/opcionais, poses/FOV, âncoras documentais, luz, tipo de corte e pôsteres. `ChapterWorld` monta somente o capítulo atual e a composição de saída por até 1,4 s. `CameraDirector` é o único escritor da câmera imersiva: GSAP coordena posição, alvo e FOV com cleanup, pausa da timeline em aba oculta e corte coberto. Uma viagem comum dura 1,1 s; as primeiras entradas de IV/VII começam diretamente na própria composição e aguardam o primeiro desenho real antes do voo de 3,6 s ou abertura de 2,2 s. A recuperação limitada de atraso do GSAP protege o movimento contra compilação de shaders. Uma proteção de tempo aplica a pose final se o ticker/RAF travar; tempo em aba oculta é excluído e conclusão é idempotente. Não há movimento de câmera durante digitação; redimensionar o teclado não inicia outro tween.

`DocumentSurface` mantém um formulário HTML semântico e estável. No desktop, sua posição deriva da projeção da âncora do capítulo, limitada à área legível. `DocumentHandoff` alinha uma folha física à área DOM; não desenha inputs nem respostas no Canvas. No celular, documento e ações ficam no fluxo vertical, com uma única rolagem, espaço inferior para os controles e retorno ao topo ao mudar a pergunta. `VisualViewport`, safe areas e foco/seleção são preservados. O limite de posição do documento também é calculado em CSS, protegendo a leitura enquanto a projeção 3D se ajusta ao resize.

Continuar valida e salva resposta/cursor antes da timeline visual. Perguntas comuns têm transição de 300 ms; o capítulo II reserva 700 ms para a troca do documento. A folha deformável e o álbum anteriores continuam no acervo compacto; não é simulada uma virada rígida no pergaminho fornecido. Trocar capítulo combina esse gesto com o corte/câmera de 1,1 s. O token e a conclusão idempotente impedem avanço duplo; pular não cancela uma gravação pendente. Voltar, revisão, entidades, famílias, hooks e exportações preservam os contratos anteriores. O progresso é por capítulo, com posição/total das etapas desse capítulo; não promete minutos. Estados de salvamento são os reais do provider.

No capítulo VII imersivo, a mesa `victorian_desk.glb` é o protagonista, e a caixa `Antique_Photo_Album.zip` permanece sobre seu tampo como objeto secundário. A animação original “Open and Close” tem 3,967 s; somente a primeira metade (até 1,9835 s) é amostrada, mantendo a tampa aberta. Na entrada, inclusive vindo de outro capítulo, esse relógio espera o primeiro desenho real da caixa fechada, preservando a abertura durante a compilação inicial de shaders. A câmera e o AnimationMixer compartilham o mesmo relógio de entrada: revelação da mesa, aproximação de 2,2 s e pose imóvel para leitura. Redução/pular aplica tampa e câmera finais imediatamente. O teclado e a mudança de pergunta não reiniciam a câmera. A gaveta anterior é preservada nas rotas compactas.

Dez fotografias selecionam exclusivamente VII01–VII10, usando o mesmo caminho de navegação que salva resposta/cursor antes da transição. Oito peças já separadas e duas cópias do papel original fornecem os pontos; as imagens/UVs originais permanecem. Clique real no mesh, marcadores HTML projetados no desktop e índice HTML de alvos de 44 px compartilham a navegação. Marcadores cobertos pelo formulário são omitidos. A edição aberta exige salvar/cancelar, conforme o fluxo existente. As fotografias são papéis anônimos em branco; nenhum rosto, lembrança, relação, resposta ou permissão narrativa é criado pela cena.

O GLB local otimizado tem 1.539 triângulos, quatro texturas originais comprimidas e 2,18 MB. `src/content/photo-box.json` registra origem, hash, transformações e ausência de autoria/licença no ZIP; não atribui CC0 ao modelo fornecido. O GLTF legado usava spec/gloss e um mapa AO como metal: materiais foram corrigidos para madeira/papel rugosos sem repintar as texturas. A orientação arbitrária de exportação foi removida, preservando articulação e todos os tempos/quaternions originais. `scripts/import-photo-box.mjs` reproduz a conversão a partir do GLTF extraído, sem depender do ZIP privado em runtime.

Som de papel é próprio, breve e de baixo volume, sintetizado por Web Audio somente após opt-in no menu. Uma permissão recusada mantém a experiência silenciosa. Nenhuma preferência autoriza autoplay audível numa visita nova.

## Carregamento, qualidade e vida útil

Storage, recursos essenciais, primeiro frame e interação são estados separados. A cena só anuncia 3D após resolução do herói e seu primeiro desenho efetivo (`onAfterRender`); falha de modelo ou WebGL mantém o formulário. Um HEAD local confirma a presença do herói antes de criar o primeiro renderizador, evitando compilação de luz desnecessária quando o arquivo estiver ausente. A espera automática inicial tem limite de 4 s; uma escolha explícita de 3D permite até 12 s. O fallback não promove 3D tardiamente durante escrita. Se o recurso de um capítulo não chegar dentro desse limite, a cena recorre ao modo leve. Se o herói já foi carregado e uma GPU lenta ainda estiver atravessando o corte, a câmera assenta imediatamente, com movimento reduzido naquele capítulo, preservando o Canvas existente. Um callback de desenho já recebido protege contra a corrida entre o watchdog e o commit React.

DPR fica entre 1 e 1,5; software/dispositivo limitado usa 1. Uma sombra direcional de 512, materiais rugosos e PMREM pequeno dispensam pós-processamento caro. Diagnósticos registram bounds, chamadas, triângulos e memória; uma janela sustentada lenta pode reduzir DPR com histerese. Esse sinal não certifica performance em aparelho físico.

`AssetRegistry` conta usuários dos GLBs próprios e libera geometria/material/texturas após a saída, com tolerância para efeitos de montagem e sobreposição. Cada clone libera seus materiais e cada textura/geometria procedural tem dono. A moldura opcional e a fotografia usam o cache compartilhado existente. Não há sete mundos ativos permanentemente.

O modo leve usa WebPs renderizados dos próprios sets em 1440×900 e 390×844. Variantes têm 4–69 KB; um SVG local aparece enquanto o pôster carrega ou se ele falhar. Modelos/pôsteres novos usam nomes com hash; não há cache imutável aplicado indiscriminadamente a HTML ou JSON. Licença, bytes e SHA-256 estão em `redesign-assets.json`, `redesign-posters.json` e no manifesto geral.

## Reprodução e verificação

```bash
python scripts/download-assets.py --cache /tmp/hogwarts-redesign-polyhaven --ids fancy_picture_frame_02
node scripts/optimize-assets.mjs /tmp/hogwarts-redesign-polyhaven
blender -b -t 2 -P scripts/redesign/model-chapters.py
node scripts/redesign/optimize-models.mjs
# Validador Khronos instalado fora do checkout, sem mudar o lockfile:
npm_config_cache=/workspace/.npm-cache npm install --prefix /tmp/hogwarts-validator gltf-validator
GLTF_VALIDATOR_MODULE=/tmp/hogwarts-validator/node_modules/gltf-validator node scripts/redesign/validate-models.mjs
npm run build
npm run start
# Em outro terminal, com Chromium disponível:
CHROMIUM_PATH=/usr/bin/chromium node scripts/redesign/capture-posters.mjs
CHROMIUM_PATH=/usr/bin/chromium node scripts/redesign/check-stability.mjs
```

Reexportar pode alterar bytes/hash conforme versão do exportador; o manifesto é atualizado pelos scripts. Validação atual dos sete GLBs: zero erros e zero avisos. O pipeline usa quantização suportada pelo GLTFLoader; não exige decoder externo nem API de runtime.

Testes cobrem início automático, retomada, redução/pular, edição/seleção em 320 px, armazenamento em falha, áudio recusado, modelo 404, WebGL perdido, curva de página e navegação reversa, famílias/condicionais, backups legados, revisão/exportação e Mestre. Capturas e comparação anterior/novo ficam no registro privado da entrega, fora de `public`.

Limitações: mobile é emulação Chromium/SwiftShader, sem Safari/aparelho físico, benchmark térmico ou entrevistas com jogadores. Bounds são a projeção do volume envolvente; os triângulos/chamadas de `gl.info` incluem passes de sombra e não equivalem apenas à geometria visível. O espelho de V usa uma reflexão planar de uma cena arquitetônica simplificada; representa janela, parede e vela, sem refletir pessoas ou o formulário. Os demais metais usam o ambiente estático existente. As medições e a publicação exatas ficam na documentação da entrega; não confundir metas de FPS/INP com resultados comprovados.

## Arquitetura compartilhada — revisão de 15/10/2026

A solicitação posterior do proprietário permite reutilizar partes do corredor nos outros capítulos. I, II, III, V, VI e VII agora usam paredes, piso, janela e porta originais como arquitetura tridimensional de fundo, em seis composições próprias. O corredor completo e a chegada da carta permanecem em IV. Os protagonistas, poses de leitura, clipes, interações, perguntas e contratos de dados são preservados. O tampo de II recebe madeira para acompanhar o ambiente.

`VictorianBackdrop` substitui a parede plana anterior. A câmera e os objetos continuam nos seus enquadramentos; os recortes são posicionados no espaço, com profundidade real, sem imagem de fundo ou novo movimento durante a leitura. Nenhum retrato, mobiliário ou objeto pessoal do corredor foi acrescentado aos outros capítulos. Os mapas originais de madeira/piso e UVs permanecem. Os pôsteres do modo leve são novas capturas das mesmas cenas.

`scripts/build-hallway-backdrop.mjs` extrai a arquitetura a partir do glTF original; `hallway-backdrop.json` registra origem, ausência de autoria/licença na fonte, hashes e variantes. São 6.335 triângulos, 2.214.100 bytes/1K no desktop e 759.376 bytes/512 no celular, ambos sem erros ou avisos Khronos. O mesmo recurso é compartilhado pelo cache durante navegação; nunca é necessário carregar o corredor completo de IV para esses fundos. Raycast dos fundos é desativado para preservar a interação com as fotografias. Clones descartam somente materiais próprios e a textura do céu; a geometria/texturas de origem usam a contagem de referências existente.
