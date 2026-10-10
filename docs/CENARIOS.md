# Cenários visuais · versão 1.2

As rotas do jogador usam um escritório vitoriano original, construído em Three.js/React Three Fiber, com câmera e objetos animados por GSAP. Combina modelos vitorianos CC0 do Poly Haven com geometria própria para os objetos interativos; não usa reproduções oficiais de Hogwarts. O emblema H também é uma composição original do projeto.

Carta: envelope com aba articulada, selo e papel que sai. Registro: folhas sobre a mesa. II: álbum de fotografias com página que vira. III: fotografia iluminada por magia. IV: envelope chega da janela. V: espelho ornamental Poly Haven com vidro texturizado (não uma reflexão planar em tempo real). VI: mapa celeste e ampulheta. VII: gaveta com fotografias. Revisão: livro com nome escolhido e capa que fecha com lacre.

Cada interação possui botão HTML acessível. Nenhum campo é renderizado como textura 3D. O nome fictício e a resposta confirmada aparecem também na textura local do livro, produzida no próprio navegador; não há transmissão de respostas ou assets buscados em APIs externas durante o uso.

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
