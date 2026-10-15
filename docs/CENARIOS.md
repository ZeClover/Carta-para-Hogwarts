# Cenários visuais · versão 3.0

As rotas compactas do jogador usam um escritório vitoriano original, construído em Three.js/React Three Fiber, com câmera e objetos animados por GSAP. Combina modelos vitorianos CC0 do Poly Haven com geometria própria para os objetos interativos; não usa reproduções oficiais de Hogwarts. O emblema H também é uma composição original do projeto.

Carta: envelope com aba articulada, selo e papel que sai. Registro: folhas sobre a mesa. II: álbum de fotografias com página que vira. III: fotografia iluminada por magia. IV: envelope chega da janela. V: espelho ornamental Poly Haven com vidro texturizado (não uma reflexão planar em tempo real). VI: mapa celeste e ampulheta. VII: gaveta com fotografias. Revisão: livro com nome escolhido e capa que fecha com lacre.

Cada interação possui botão HTML acessível. Nenhum campo é renderizado como textura 3D. O nome fictício e a resposta confirmada aparecem também na textura local do livro, produzida no próprio navegador; não há transmissão de respostas ou assets buscados em APIs externas durante o uso.

A raiz e o modo fullscreen usam entrada automática, sete novos protagonistas GLB, documentos nativos e pôsteres das próprias cenas; veja [direção dos capítulos 3.0](DIRECAO-CAPITULOS.md). O relato 1.2 abaixo preserva o histórico do escritório compacto, não descreve o enquadramento atual da experiência. A coruja procedural foi removida.

## Funcionamento e orçamento

- O módulo 3D é carregado por demanda, só quando o cenário está próximo da área visível e WebGL 2 está disponível sem indicação de grande limitação de desempenho. Renderizadores por software (SwiftShader/llvmpipe) começam no cenário leve; o botão permite ativar 3D explicitamente.
- Ilustração SVG local aparece imediatamente. Se WebGL não existe, falha ou perde o contexto, a experiência continua em 2.5D, identificada na interface. O botão “Usar cenário leve” permite essa escolha manual.
- Renderização sob demanda: sem loop contínuo. Transições duram até 1,8 s e invalidam os frames apenas durante a animação. Fora da área visível, o Canvas é desmontado.
- DPR limitado a 1,5; sombras 512×512; meshes paramétricas simples; cinco GLBs locais com texturas até 1K, cerca de 3,01 MB no total, carregados conforme a cena. Sem HDRI externo. Texturas do livro: papel 512×512 e couro 256×256 gerada localmente. Ambiente do espelho gerado em memória.
- `prefers-reduced-motion` e “Pular animação / reduzir movimento” aplicam posições finais sem transição. O questionário nunca depende da conclusão da animação.
- As cenas não alteram respostas, permissões, revisões ou salvamento. Recarregar preserva formulários e reinicia apenas a composição visual.

## Fontes e acesso externo

O manifesto está em `src/content/assets-manifest.ts`, com metadados, URLs oficiais, MD5 originais e SHA256 dos GLBs em `src/content/generated-assets.json`. Os cinco modelos baixados e integrados são:

| Modelo                 | Autoria                      | GLB local     |
| ---------------------- | ---------------------------- | ------------- |
| Classic Console 01     | Kirill Sannikov              | 657.004 bytes |
| Arm Chair 01           | Kirill Sannikov              | 667.144 bytes |
| Fancy Picture Frame 01 | Rob Tuytel / Rico Cilliers   | 635.472 bytes |
| Ornate Mirror 01       | James Ray Cock               | 623.724 bytes |
| Mantel Clock 01        | Yann Kervran / Rico Cilliers | 424.836 bytes |

Todos são CC0-1.0. Os termos da API hospedada foram consultados, com User-Agent próprio; há crédito “Powered by Poly Haven”. O aplicativo serve os arquivos locais, sem consultar a API em tempo de uso. A tentativa inicial recebeu CONNECT HTTP 403; depois da atualização da rede, downloads oficiais funcionaram. O endpoint `/assets/{id}` da especificação retornou 404: os metadados confirmados vieram da listagem `/assets?type=models`, e as URLs de arquivos vieram de `/files/{id}`.

Pipeline reproduzível, opcional para atualizar assets (não necessário para instalar/usar):

```sh
python scripts/download-assets.py
node scripts/optimize-assets.mjs
```

O downloader valida cada tamanho e MD5 informado pela API e rejeita caminhos fora do cache. O otimizador usa glTF Transform para deduplicar/remover conteúdo não usado e Sharp para recomprimir texturas até 1K, empacotando GLB sem exigir Draco ou decodificador externo. Os originais ficam no cache fora do checkout; apenas as versões finais estão em `public/assets`. Não há Blender, scraping ou download de scripts comunitários. Falha ao carregar um modelo preserva o objeto procedural correspondente; perda de WebGL mantém a ilustração interativa local.

Nenhum Blender, conta de assets, chave de IA generativa ou assinatura paga é necessário para os cenários implementados. Os objetos interativos procedurais e a ilustração leve são arte final própria, não pendências de pesquisa atribuídas ao proprietário.

## Evidência de validação

A verificação de navegador cobre abertura da carta, posição de câmera mudando durante o travelling, álbum, espelho, troca manual de renderizador, perda de contexto, teclado, movimento reduzido e resposta salva após recarregar. Os testes 3D ativam SwiftShader explicitamente para conferir WebGL no servidor sem GPU; esses tempos não representam desempenho de GPU de um celular real.

Em simulação adicional com viewport de iPhone 13, cache vazio, 150 ms de latência e download de 200.000 bytes/s, o Registro em modo leve ficou disponível em 2.015 ms; edição e salvamento foram confirmados em 3.148 ms desde o início da navegação, com 207.909 bytes transferidos e nenhum HTTP 404/erro. É uma medição desta máquina, do caminho sem WebGL, não uma garantia de tempo para todos os aparelhos ou da renderização 3D.

## Refinamento cinematográfico 1.2

EnchantedBook substitui a folha rígida anterior. Capa espessa com couro granulado local e filetes, lombada semicilíndrica com nervuras, dois blocos de papel, 22 bordas irregulares por lado e páginas com curvatura próxima da encadernação. Papel fosco recebe sombras; capa e papel têm texturas determinísticas geradas no navegador, sem downloads de texturas nem envio de respostas.

A folha tem 32×12 células (429 vértices, 768 triângulos). pageGeometry integra tangentes variáveis ao longo da largura, preservando o comprimento e criando uma curva móvel, elevação diagonal da ponta e acomodação final. GSAP sincroniza 1,55 s de deformação com o intervalo protegido de 1,65 s na interface. Frente e verso usam material DoubleSide. Continuar e Voltar persistem o cursor antes da animação; a virada reversa não imprime outra resposta. Pular, movimento reduzido, saída e restauração interrompem o efeito sem alterar respostas. A ilustração leve usa curva SVG animada, sem WebGL.

Câmera aproxima a escrivaninha, muda lateralmente a composição entre capítulos e fica imóvel durante leitura. Luz quente principal e luz fria de janela fazem transições curtas por capítulo. Sombras PCF suaves 512², luz hemisférica de preenchimento e metais rugosos evitam pós-processamento pesado. Chamas e poeira fazem pequenos movimentos por 2,5 s a cada 16 s, a oito atualizações por segundo; nenhum movimento em modo reduzido, dispositivo limitado ou aba oculta. Canvas desmonta fora de vista; timers, geometrias próprias e texturas são liberados no encerramento.

Novo modelo pesquisado pela API oficial: mantel_clock_01, CC0 confirmado na página oficial de licença, originais com tamanho/MD5 conferidos e GLB final com SHA256 registrado. A geometria do relógio foi simplificada para 7419 vértices, com limite de erro de 0,2%, e as texturas reduzidas a 512px. Modelos de livros decorativos não oferecem a folha interativa; livro, coruja pousada na janela, pergaminhos e baú foram construídos proceduralmente. Não há dependência de Blender, serviços pagos ou assets de outros jogos. O otimizador permite integrar só um novo asset sem apagar os registros anteriores. A pena usa contorno curvo, haste e linhas de barbas, substituindo a elipse lisa anterior.

Dispositivos com até 4 GB de memória informada, até quatro núcleos ou economia de dados começam em modo leve. Podem ativar 3D explicitamente, com DPR 1 e animações ambientais suspensas. O restante mantém DPR até 1,5. Emulação de viewport/SwiftShader valida comportamento e imagens; não substitui medição em celular físico. As medições antigas de carregamento acima são do caminho leve v1.1, não benchmarks desta versão.

## Caixa de fotografias no capítulo VII

A experiência fullscreen usa o arquivo `Antique_Photo_Album.zip` fornecido pelo proprietário. A versão local do GLB, seus hashes, dimensões das texturas e a animação original estão documentados em `src/content/photo-box.json`. A autoria/licença não constam no arquivo enviado; nenhum crédito CC0 ou Poly Haven é atribuído à caixa. O acervo CC0 anterior e a gaveta das rotas compactas permanecem preservados.

As fotografias originais são papéis envelhecidos sem cenas de pessoas ou lugares. Oito folhas separadas e duas cópias da geometria original são pontos de navegação para as dez perguntas existentes de VII. A caixa abre com seus próprios keyframes; a metade de fechamento é omitida para manter a leitura estável. Não são criadas respostas, relações ou lembranças pelo cenário. Consulte `docs/DIRECAO-CAPITULOS.md` para câmera, interação acessível e reprodução da conversão.

## Tinteiro com pena no capítulo III

A experiência fullscreen usa **Ink Bottle with Quill**, de [Matthew Collings](https://sketchfab.com/mtcollings), sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). [Modelo original](https://sketchfab.com/3d-models/ink-bottle-with-quill-ef967c9bc13b4635add8ab7517dfedfe). Esses créditos e URLs constam no próprio GLB enviado pelo proprietário e aparecem na interface.

O arquivo é preservado byte por byte: 2.641.960 bytes (2,52 MiB), 1.288 triângulos, três texturas PNG de 1024×1024, UVs e parâmetros originais no GLB. Em runtime, as texturas originais continuam aplicadas: o vidro usa alpha hash com teste de profundidade e não recebe autossombra; a pena usa recorte alfa 0,25. Isso corrige triângulos escuros de transparência sem repintar o atlas. O manifesto `src/content/ink-quill.json` registra hash e proveniência. Não há animações embutidas; a pena já é uma peça separada. Somente seu transform recebe uma manifestação procedural de 2,4 s, com leve elevação e oscilação, voltando à pose original. A câmera compartilha o relógio e fica imóvel para a leitura. Redução de movimento e pular aplicam o repouso imediatamente; o modo leve usa uma captura do mesmo modelo, com SVG de tinteiro caso a imagem não carregue.

Nenhuma tinta, memória, primeira magia ou resposta é escrita automaticamente. A caixa, suas fotografias, a animação original e as perguntas de VII continuam preservadas. Os modelos anteriores permanecem no acervo das rotas compactas.

## Modelos fornecidos em V, VI e VII

Os originais são guardados fora de `public`, sem alterações. `scripts/import-supplied-model.mjs` registra hashes, texturas, peças e adaptações nos manifestos `mirror.json`, `armillary.json`, `hourglass.json` e `desk.json`. Os assets anteriores continuam disponíveis às rotas compactas. O importador não altera o pacote ou o lockfile.

| Capítulo | Modelo e origem | Licença declarada no GLB | Asset servido |
|---|---|---|---|
| V | [Ornate Mirror — Arnold Konrad](https://sketchfab.com/3d-models/ornate-mirror-68a8a9f27f6f4fb3b9d568bbb5db1086) | Sketchfab Standard | 3,62 MB; 9.675 triângulos, moldura reunida e vidro separado |
| VI | [Armillary sphere — Stellarator](https://sketchfab.com/3d-models/armillary-sphere-astrolabe-d9c7e19aeef940fcac65efc964534a9c) | CC BY 4.0 | 4,67 MB; 42.168 triângulos, pivôs e peças separados preservados |
| VI, secundário | [Hourglass — Inknot](https://sketchfab.com/3d-models/hourglass-6cdbe313e61a48c584a1a77b0925aac6) | CC BY 4.0 | 2,72 MB; 28.364 triângulos, mapas originais reduzidos a 512 |
| VII | [Victorian Desk — Faheem Yusuf](https://sketchfab.com/3d-models/victorian-desk-ac061b3de2b9480d8ca175e9fdc0c785) | CC BY 4.0 | 1,79 MB; 4.762 triângulos e oito peças originais |

Não há animações embutidas nesses quatro modelos. A câmera de V aproxima por 1,6 s. Seu vidro conserva a geometria e a pátina do atlas original; um `Reflector` de 512/256 pixels desenha uma cena 3D arquitetônica simplificada com parede, janela e vela. Isso evita regiões pretas de pisos distantes e reflexos do formulário, sem webcam, rosto, avatar ou características inferidas. A projeção planar acompanha a câmera; o render de reflexão fica em cache durante leitura. Os materiais, geometrias da cena auxiliar e render target têm descarte explícito.

Em VI, a câmera e o anel original `ecliptic_high` compartilham 2,1 s. Somente esse anel oscila até aproximadamente 4,3 graus, voltando à sua pose original; a base não gira e não há rotação contínua. A redução de 122.680 para 42.168 triângulos tem erro geométrico máximo 0,001 nas unidades da fonte. O metal principal mantém mapas de 1K; planetas pequenos usam 256/512. A ampulheta é secundária e fica parada. O arquivo original trazia vidro preto com transmissão total e areia preta: a adaptação corrige o vidro para claro com alfa 0,20, sem refração de tela, face frontal e sem sombras opacas; a geometria da areia recebe tom envelhecido. Texturas ornamentais originais são mantidas.

Em VII, uma gaveta central realmente separada (`desk:polySurface13`) translada de fechada até a posição aberta original por 2,2 s. Não é uma animação incluída no GLB. A porta e as outras gavetas mantêm suas posições abertas da fonte. A mesma câmera sincroniza essa abertura com a animação original da caixa de fotografias, agora menor e apoiada no tampo. Dez fotografias ainda selecionam exclusivamente VII01–VII10. A gaveta fornece também uma interação com VII10, usando o mesmo caminho que salva o cursor e a resposta antes da transição. Nenhum parente, segredo, memória ou evento é inventado.

As oito fotografias externas se distribuem em duas filas de quatro no tampo em desktop. Os controles projetados têm 44 px e evitam sobreposição; em enquadramentos menores, o índice HTML mantém todas as dez opções. No celular esse índice é a navegação principal, sem exigir precisão para tocar uma fotografia pequena.

Os capítulos e objetos têm enquadramentos específicos de desktop/celular e escala responsiva. Perguntas, edição, condições, revisão, famílias, progresso, JSON e Mestre usam os contratos existentes. Reduzir/pular assenta os objetos e a câmera; as respostas permanecem em HTML semântico. Pôsteres locais são capturas dos mesmos modelos para o modo leve. As verificações de navegador usam Chromium com WebGL real via SwiftShader e emulação móvel; não são medições em um celular físico.
