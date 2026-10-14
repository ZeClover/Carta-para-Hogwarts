# Direção dos capítulos · 3.0

`/` e `/experiencia` compartilham a experiência fullscreen. Não há landing ou clique obrigatório para começar. O provider distingue armazenamento em leitura, registro novo, restaurado e falha de recuperação. Um erro na leitura não cria outro personagem nem permite gravar sobre o registro anterior; a tela oferece recarregar ou importar um backup validado com confirmação explícita.

A abertura é silenciosa e automática para um registro novo: envelope, aba articulada, saída da folha e pose de leitura. O percurso dura 4,6 s no desktop e 3,4 s no celular em modo leve; no 3D, o assentamento final de câmera acrescenta até 0,9/0,55 s. A contagem começa após a apresentação estar disponível. Registros restaurados vão à pergunta salva. Pular abertura é uma ação pontual; pular animações vale para a sessão; reduzir movimento e qualidade são preferências separadas do JSON narrativo. Não há autofocus de input.

## Objetos e composições

| Capítulo | Novo trabalho tridimensional                                                                      | Documento                     |
| -------- | ------------------------------------------------------------------------------------------------- | ----------------------------- |
| I        | Envelope de papel com espessura, dobras, lacre irregular em relevo; aba e folha animadas          | Carta marfim                  |
| II       | Pranchas de couro, tecido, lombada costurada e cantoneiras; preserva a folha deformável existente | Álbum; uma página no celular  |
| III      | Tinteiro, pena e papel subdividido curvo; gesto abstrato curto                                    | Cartão de relato claro        |
| IV       | Caixilho profundo, perfis, vidraças com chumbo e peitoril; correspondência em primeiro plano      | Correspondência               |
| V        | Nova moldura Poly Haven 02 convertida em espelho, vidro prateado e base modelada                  | Pergaminho ao lado            |
| VI       | Mapa circular de algodão com coordenadas e estrelas geométricas; suporte torneado e ampulheta     | Cartela marfim com tinta azul |
| VII      | Gaveta rasa de nogueira, divisórias, inlay, puxador volumétrico e documentos empilhados           | Ficha de arquivo              |

Os sete protagonistas são GLBs locais novos ou reconstruídos por scripts Blender; nenhum requer Blender no navegador. O espelho deriva da nova `fancy_picture_frame_02`, de Rob Tuytel e Rico Cilliers, CC0, com origem e checksums oficiais registrados. O acervo anterior permanece para as rotas compactas. Livro enciclopédico e gaveteiro Poly Haven também foram pesquisados e baixados com verificação, mas não integrados: o álbum articulado e a gaveta rasa exigem outras silhuetas/estruturas. Não há criaturas, rosto inventado, webcam, varinha, Expresso ou Seleção. A fotografia CC0 do álbum é ambientação anônima, sem determinar a infância.

## Direção e edição

`chapterScenes` declara heróis, recursos críticos/opcionais, poses/FOV, âncoras documentais, luz, tipo de corte e pôsteres. `ChapterWorld` monta somente o capítulo atual e a composição de saída por até 1,4 s. `CameraDirector` é o único escritor da câmera imersiva: GSAP coordena posição, alvo e FOV com cleanup, pausa da timeline em aba oculta e corte coberto. Uma viagem dura 1,1 s. Uma proteção de tempo aplica a pose final se o ticker/RAF travar; tempo em aba oculta é excluído e conclusão é idempotente. Não há movimento de câmera durante digitação; redimensionar o teclado não inicia outro tween.

`DocumentSurface` mantém um formulário HTML semântico e estável. No desktop, sua posição deriva da projeção da âncora do capítulo, limitada à área legível. `DocumentHandoff` alinha uma folha física à área DOM; não desenha inputs nem respostas no Canvas. No celular, documento e ações ficam no fluxo vertical, com uma única rolagem, espaço inferior para os controles e retorno ao topo ao mudar a pergunta. `VisualViewport`, safe areas e foco/seleção são preservados. O limite de posição do documento também é calculado em CSS, protegendo a leitura enquanto a projeção 3D se ajusta ao resize.

Continuar valida e salva resposta/cursor antes da timeline visual. Perguntas comuns têm transição de 300 ms; o álbum tem 700 ms, com curvatura de 650 ms. Trocar capítulo combina esse gesto com o corte/câmera de 1,1 s. O token e a conclusão idempotente impedem avanço duplo; pular não cancela uma gravação pendente. Voltar, revisão, entidades, famílias, hooks e exportações preservam os contratos anteriores. O progresso é por capítulo, com posição/total das etapas desse capítulo; não promete minutos. Estados de salvamento são os reais do provider.

No capítulo VII, clicar nos documentos da gaveta abre o editor existente de pessoa/objeto ou ponta aberta da pergunta atual; os botões HTML correspondentes continuam disponíveis. Nenhum objeto cria fatos automaticamente.

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

Limitações: mobile é emulação Chromium/SwiftShader, sem Safari/aparelho físico, benchmark térmico ou entrevistas com jogadores. Bounds são a projeção do volume envolvente; os triângulos/chamadas de `gl.info` incluem passes de sombra e não equivalem apenas à geometria visível. A reflexão usa ambiente estático, sem paralaxe planar. As medições e a publicação exatas ficam na documentação da entrega; não confundir metas de FPS/INP com resultados comprovados.
