# Direção dos capítulos · 2.0

O modo `/experiencia` tem um diretor próprio, em vez de reutilizar a câmera do escritório compacto. `chapterDirection.ts` declara protagonista, superfície de leitura, temperaturas de luz e poses de câmera/alvo para desktop e retrato. Os capítulos ocupam posições físicas diferentes. `ChapterWorld` mantém somente a composição atual e a anterior durante a viagem de 2,2 s; depois libera a anterior. CameraDirector interpola posição e alvo a partir dos valores presentes, com requestAnimationFrame e tempo real; atrasos de renderização não prolongam intencionalmente a viagem. GSAP anima os objetos. O Canvas permanece ativo e a página não recarrega. A área de resposta espera a chegada ao destino; pular ou reduzir movimento libera os campos imediatamente. Durante leitura a câmera fica estável. A confirmação aproxima discretamente o objeto por 1,4 s.

| Capítulo | Protagonista e interação                                     | Leitura                             |
| -------- | ------------------------------------------------------------ | ----------------------------------- |
| I        | Documento flexível, envelope com dobra e lacre irregular     | Carta clara, tinta escura           |
| II       | Álbum ampliado, fotografia sépia, páginas curvas reversíveis | Página com cantos de álbum          |
| III      | Fotografia em moldura CC0 e objeto que levita brevemente     | Superfície verde, distinta da carta |
| IV       | Janela ampliada e correspondência articulada                 | Carta com borda dupla               |
| V        | Espelho ornamental ampliado e brilho do vidro                | Superfície clara com arco           |
| VI       | Carta celeste com coordenadas, ampulheta de vidro curvo      | Carta azul de sonhos                |
| VII      | Arquivo de madeira, gaveta móvel, cartas e fotos             | Folhas empilhadas de arquivo        |

Não há livro central nos sete ambientes, nem coruja procedural. Os modelos anteriores e as cenas compactas continuam no projeto; `StudyObjects` reúne os objetos reutilizados. `SceneStage` preserva as opções de qualidade, movimento reduzido, detecção de dispositivo limitado e perda de contexto. A fotografia de floresta é ambientação anônima, não uma afirmação sobre a infância do personagem.

O fallback tem sete composições SVG próprias, em `ChapterFallback`, incluindo os mesmos protagonistas. Campos, famílias, relações e oportunidades continuam sendo HTML real. Superfícies claras usam tinta escura e superfícies escuras usam tinta clara; foco e estados de erro têm contorno explícito. Desktop organiza leitura e objeto em lados opostos; mobile reenquadra os objetos no alto, com leitura e navegação abaixo. Pergunta e navegação ficam agrupadas, sem separar os botões por grandes espaços vazios. A área de edição extensa rola internamente e acompanha `visualViewport` quando a tela útil diminui.

A sequência de perguntas, contratos JSON, regras, permissões e lógica de persistência não foram reescritos. A resposta e o cursor são salvos antes dos efeitos existentes; saltar, voltar, restaurar ou sair mantém a proteção contra transições pendentes.

## Fotografia e orçamento

`memory-forest.jpg` deriva do JPG oficial tonemapped de **Autumn Forest 01**, de **Andreas Mischok**, Poly Haven, **CC0-1.0**. Download oficial: 12.226.358 bytes; tamanho e MD5 conferidos antes do processamento. A versão local tem 512×512, tons sépia e 86.270 bytes. URLs, autoria, licença, checksum original e SHA256 final estão em `src/content/memory-asset.json`, incluído no manifesto geral. A preparação é reproduzível com `python scripts/prepare-memory.py`; não é necessária para instalar ou iniciar a aplicação. O arquivo original não é servido pelo aplicativo. Não há API externa durante o jogo.

Continuam disponíveis os cinco GLBs locais existentes, com créditos e arquivos preservados. Texturas procedurais têm até 512²; couro 256². A folha subdividida do álbum preserva as 429 posições e o perfil de curvatura anterior. Papéis são foscos; metais recebem ambiente pequeno gerado em memória. Nenhuma reflexão planar, pós-processamento ou transmissão de vidro exige passe pesado adicional. Renderização sob demanda, DPR máximo 1,5 (1 em dispositivos limitados), sombra 512². Geometrias e texturas criadas por cada composição são liberadas após desmontagem; recursos GLB compartilhados pertencem ao cache do loader.

## Validação

`chapter-direction.spec.ts` percorre os sete capítulos na mesma resolução, captura as composições leves e WebGL, verifica acessibilidade, área de leitura dentro da tela, navegação visível e protagonistas distintos. Grava a navegação entre álbum e espelho e verifica deslocamento real de câmera com o mesmo Canvas. Os testes existentes continuam verificando questionário completo, exportação/importação do Mestre, respostas condicionais, backups, salvamento, retomada, virada reversa e perda de WebGL.

Screenshots são inspecionadas além das asserções: o reconhecimento visual não é demonstrado por atributos de teste. Os testes usam Chromium e SwiftShader, com viewport de celular; não medem FPS, teclado nativo ou conforto em aparelho físico.
