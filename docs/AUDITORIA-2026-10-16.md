# Carta para Hogwarts — auditoria de 16/10/2026

**Auditoria concluída na branch local. Correções implementadas e testadas; sem publicação ou merge.**

Escopo: aplicação existente e site publicado, preservando o trabalho visual, conteúdo e dados. Branch separada `audit/full-project-2026-10-16`, criada sobre `49dfe27b72710e5c0ecbf34efb981f3bb6c9fc66`. Não houve reset, force-push, merge ou publicação. Todos os testes utilizaram perfis isolados e personagens fictícios; não acessaram dados reais dos jogadores.

## A. Inventário e funcionamento

| Área | Implementação e comportamento auditado |
| --- | --- |
| Entrada | `/` e `/experiencia`: tela de início/retomada por clique; opção leve. Conforme nova orientação durante a auditoria, o cenário pode carregar antes do clique com câmera/objetos pausados; animação, perguntas e cursor só são liberados ao iniciar. |
| Experiência | Cena fullscreen por CSS; sete composições e câmera dirigida. Não exige fullscreen nativo. Perguntas e respostas continuam em HTML semântico. |
| Capítulo I | Registro de Admissão: envelope, lacre, aba articulada e extração da folha; oito perguntas cadastrais. Obrigatórios: nome, nascimento, naturalidade e residência. Idade calculada em 01/09/1890, com orientação de onze anos e exceções permitidas ao Mestre. |
| Capítulo II | Antes da Carta: pergaminho fornecido, nove perguntas narrativas, seleção de família e editores de pessoas/objetos. |
| Capítulo III | O Despertar da Magia: tinteiro/pena, manifestação curta procedural na peça separada; sete perguntas. III01 obrigatório admite sim/não/parcialmente/incerto. |
| Capítulo IV | O Chamado de Hogwarts: corredor completo, exterior discreto, carta em voo, aproximação e repouso. Janela fixa não é apresentada como articulada. Nove perguntas; orientação depende da familiaridade com magia. |
| Capítulo V | Quem Você Realmente É: espelho ornamentado com reflexão planar de arquitetura simplificada, sem rosto ou câmera pessoal; nove perguntas. |
| Capítulo VI | Aquilo que o Coração Guarda: esfera armilar protagonista, um anel separado em movimento breve, base fixa e ampulheta secundária com vidro claro; nove perguntas. |
| Capítulo VII | Laços, Segredos e Pontas Soltas: mesa vitoriana protagonista, gaveta realmente separada, caixa fotográfica secundária com clipe original e dez fotografias vinculadas às dez perguntas existentes. |
| Navegação | Continuar/Voltar, confirmação de capítulos, menu, atalhos de fotografias, saída e retomada do cursor. Respostas/cursor gravados antes da transição; proteção contra avanço duplo, edição aberta e falha de escrita. |
| Animações | Primeira cena desenhada/preparada antes da entrada, movimentos limitados por frames, câmera parada na leitura, reprodução manual por “Ver animação”, pular, redução do sistema e preferência manual. |
| Qualidade | WebGL2 opcional; alternativa 2.5D e pôsteres locais. Qualidade automática conforme memória/CPU/economia de dados/software renderer; DPR limitado 0,75 ou teto 1,5. Recuperação de asset 404, espera excessiva, driver sem confirmação assíncrona e perda de contexto. |
| Conteúdo | 61 perguntas principais (8 cadastrais e53 narrativas), família e confirmações. Onze opções de família, cinco estados de resposta, explicações condicionais e sugestões contextuais. Não atribui Casa, sangue, poderes, rosto, parentes ou fatos ao personagem. |
| Relações/objetos | IDs reutilizáveis, pessoas, objetos/lugares e explicações. A ficha preserva referências validadas, fatos, crenças e perguntas separadamente. |
| Pontas abertas | Criação explícita pelo jogador; fatos, crenças, pergunta, restrições, interesse, permissão e consentimento para campanha. Sugestões nunca viram fatos automaticamente. É permitido concluir sem oportunidades. |
| Persistência | IndexedDB local: registro `hogwarts-player`, história `hogwarts-narrative`, Mestre `hogwarts-master`. Autosave, avisos reais de falha, tentativa de salvar e backup/restauração. História usa cursor opcional, compatível com backups anteriores. |
| Revisão | Quatro folhas: história, oportunidades, interesses e limites; assinatura simbólica, confirmação dos capítulos, JSON final e reexportação com ID estável/revisão crescente. |
| Backups | Completo do jogador, legado cadastral e arquivo do Mestre. Restaurar exige validação e confirmação. Exportação final exclui textos pulados/ocultos; backup privado conserva o rascunho. |
| Mestre | Importação múltipla, validação individual, conflito de revisões, busca, comparação, filtros, relações, linha do tempo sem anos inferidos, conexões confirmadas manualmente, notas privadas e backup/restauração. |
| Compatibilidade | `/criar/I` a `/criar/VII` mantêm os editores compactos e acervo anterior. `/revisao` e `/mestre` continuam acessíveis. |
| Recursos locais | 39 assets nos manifestos, 24 GLBs.44.641.750bytes de acervo total; carregamento por capítulo, não conjunto. 24 modelos sem erros estruturais;9 avisos de tangentes em6 modelos antigos. |
| Plataforma | Next.js 16.4, React 19.3, TypeScript, Three.js 0.186/R3F 9.8, GSAP 3.15, Zod e IndexedDB. Build estática onde possível; `/experiencia` valida parâmetro e usa renderização do servidor. |

Não há autenticação, banco de fichas no servidor, API de personagens, pagamentos, IA de geração narrativa, analytics de conteúdo ou sincronização entre dispositivos. `/mestre` é local ao perfil do navegador e informa isso na interface. A Vercel hospeda código/assets; não recebe as fichas importadas ou as respostas através de um endpoint da aplicação.

### Segurança e privacidade

As respostas são renderizadas por React como texto; não foi encontrado `dangerouslySetInnerHTML`, `eval` ou `new Function` no código da aplicação. Importações passam pelos contratos Zod, limites de tamanho, verificação de referências e confirmação de conflitos; nomes/HTML malicioso não são tratados como marcação executável. Os testes existentes exercitam JSON inválido, versão incompatível, IDs/revisões, referências e isolamento das notas do Mestre. Isso é uma revisão de código e dos fluxos cobertos, não uma certificação de segurança nem um teste de intrusão da infraestrutura Vercel.

### Fidelidade e histórico

Comparei histórico, documentação e decisões anteriores antes de modificar a aplicação. `admission.ts`, `chapters.ts` e `families.ts` permanecem idênticos ao primeiro aplicativo completo (`dde425e`). O contrato narrativo difere dessa versão apenas pelo cursor opcional `experienceStep`, acrescentado anteriormente. Nesta auditoria, nenhum desses arquivos nem os modelos/texturas foram alterados.

Os sete capítulos estão na ordem correta. Textos mantêm1890, início do primeiro ano e passado anterior à chegada. Famílias distinguem referência do universo, contexto da campanha e possibilidade original. Não encontrei atribuição automática de fatos privados nem antecipação jogável de Beco Diagonal, varinha, Expresso ou Seleção. A arte é de projeto de fãs, sem afiliação oficial. O espelho não fabrica rosto e as fotos interativas não escolhem memórias.

O candidato `Hogwarts_letter.zip` continua excluído, conforme a decisão anterior. A carta em uso é a do aplicativo. Abertura/cena inicial são genéricas; a identificação é preenchida no registro e aparece na revisão/livro final. Não existe personalização integral do texto e do endereço do envelope por todas as respostas.

## B. Problemas encontrados

| ID | Gravidade | Causa, impacto e evidência |
| --- | --- | --- |
| AUD01 | Alta | `Master.tsx`: ao falhar a leitura, criava arquivo vazio em memória e liberava o botão de salvar/importações. A reprodução real preservou uma nota fictícia, forçou erro de leitura e clicou em tentar salvar: o IndexedDB passou de uma nota a zero. Evidência: `master-reproduction.log`, trace e captura. |
| AUD02 | Média | `Review.tsx`: conclusão apenas em `useState(false)` era perdida na recarga. O JSON e a revisão persistiam, mas epílogo e botão de reexportar desapareciam. Reproduzido após download bem-sucedido, sem falha de armazenamento. |
| AUD03 | Baixa | README e documentos de direção/cenários ainda descreviam entrada automática e limites antigos, em contradição com a tela por clique já publicada. |
| AUD04 | Verificação | Testes antigos selecionavam todos os avisos `role=status`, pressupunham o foco anterior à tela inicial e DPR 1 em modo limitado 0,75. Um teste de página misturava relógio simulado com abertura dirigida por frames. Scripts de captura/estabilidade também não atravessavam a nova entrada e o segundo ainda procurava a interação da antiga cena de VII. Na verificação prolongada, o contador do último frame ainda incluía recursos já liberados:49 geometrias/19 texturas antes de atualizar o desenho,21/12 depois. A coleta foi corrigida sem aumentar a tolerância de recursos. |
| AUD05 | Desenvolvimento | `npm audit` apontou cinco nós de severidade alta provenientes de um advisory de `braces<=3.0.3`, transitivo de eslint-config-next→plugin-next→fast-glob→micromatch. GHSA-vfj7-8cjw-p6xm: exaustão de pilha em padrões profundamente aninhados. Não é dependência de produção, e não processa respostas do jogador. Latest consultado3.0.3, sem versão corrigida disponível. |
| AUD06 | Compatibilidade visual | Validador Khronos reportou9 avisos de tangentes geradas em tempo de execução em6 modelos CC0 antigos. Não são erros GLB nem assets ausentes; afetam portabilidade potencial dos normal maps. Modelos atuais fornecidos não apresentaram esses avisos. |
| AUD07 | Média | Falha temporária de download GET 503 deixava a promessa rejeitada no cache GLTF/Suspense. Repetir “Ativar cenário 3D” não realizava outro download. Reprodução real: uma única requisição após o retry, em `cache-reproduction-real.log`. |

O erro crítico AUD01 foi diagnosticado e corrigido na branch. Continua presente na versão pública de partida até uma publicação aprovada; testar a produção não aplica as correções locais.

## C. Correções realizadas

- `src/components/master/Master.tsx`: bloqueio independente para falha de leitura. Não permite persistir, importar ou editar um arquivo que não conseguiu recuperar. Tela específica oferece recarga e restauração de backup validado, com confirmação explícita. Erros de escrita continuam oferecendo tentativa de salvar e exportação em memória. Nenhuma alteração no formato dos dados.
- `src/components/narrative/Review.tsx`: reconhece uma exportação anterior pela revisão persistida e validação atual. Reabrir não incrementa a revisão, exporta automaticamente ou modifica respostas.
- `AssetRegistry.ts` e `StudyCanvas.tsx`: uma nova tentativa limpa caches de recursos não retidos, incluindo promessas rejeitadas; modelos usados por cenas montadas permanecem preservados. Regressão reproduz GET 503 e exige um segundo download e resposta intacta.
- `CinematicExperience.tsx`, `CameraDirector.tsx`, `ChapterWorld.tsx`, `SceneStage.tsx`, `StudyCanvas.tsx` e CSS: conforme nova orientação do usuário, preparação do 3D antes de iniciar, pose inicial congelada, mesma instância de Canvas após o clique e camada 3D inerte durante a espera e ausência de marcação de cena vista durante a espera. Clique durante o download continua aguardando a preparação; modo leve e redução de movimento preservados.
- `preload-start.spec.ts`: entradas I, IV e VII em desktop/mobile verificam download e desenho antes do clique, pose/câmera estáveis, movimento intermediário depois do clique e continuidade do mesmo Canvas. No corredor, confere também a posição do mesh real, além do relógio de animação.
- `.github/workflows/ci.yml`: orçamento do job de 25 para 45 minutos; a rodada integral observada levou 24,5 minutos antes dos novos casos. Não desabilita testes nem afirma aprovação de CI remoto.
- README e documentos de direção/cenários/experiência: orientação de preparação antes do clique, início explícito da animação, prazos reais do watchdog (30 s +5 s no fullscreen; 8/12 s no compacto) e separação dos orçamentos históricos/atuais.
- `tests/e2e/admission.spec.ts`, `scenes.spec.ts` e `cinema-3d.spec.ts`: seletores e preparação atualizados, preservando as verificações de gravação, teclado, curvatura, reversão e contexto WebGL.
- `tests/e2e/audit-recovery.spec.ts`: regressões de perda de dados por falha de leitura, restauração confirmada/cancelada, erro de escrita, backup, retry, conclusão após recarga e salvamento sem rede/fechamento da aba.
- `scripts/redesign/capture-posters.mjs` e `check-stability.mjs`: clique real de entrada e interação atual de gaveta/fotografias. Teste de estabilidade continua contando recursos em20 voltas; não usa apenas compilação como evidência.

AUD05 não recebeu downgrade forçado do Next/ESLint. Essa sugestão do npm quebraria a compatibilidade da versão instalada e não constitui uma correção verificada. AUD06 permanece documentado; não houve substituição automática das texturas ou alteração especulativa de seis modelos sem defeito visual reproduzido.

## D. Testes executados

**Rodada integral: 122/122 cenários de navegador aprovados, sem pulos nem flakiness, em 26,6 minutos.** Desktop e celular emulado: 61 casos cada. Logs originais, reprovações anteriores, repetições e capturas foram preservados. Após a última proteção semântica da camada preparada (`inert` até iniciar), o rebuild, lint, tipos e17 testes unitários passaram novamente; os6 casos de pré-carregamento foram repetidos e passaram em 1,9 minuto. São repetições de casos da suíte, não 128 cenários distintos. Nenhuma pergunta, biblioteca de dados, modelo ou textura mudou entre essas verificações.

A rodada intermediária de 114 casos terminou 110 aprovados/4 reprovados. Foram corrigidas a seleção ambígua de texto no teste de restauração, a mistura de relógio simulado com a abertura e a medição de contraste durante o fade. Uma rodada dirigida de 30 casos passou depois das correções e do novo pré-carregamento. A rodada integral 122 acima confirmou os cenários em conjunto. Tentativas sem testes executados e a triagem inicialmente interrompida não são contadas como validação aprovada.

| Verificação | Resultado | Evidência local |
| --- | --- | --- |
| Produção, lint e TypeScript | Aprovados | `build-complete.log`, `lint-complete.log`, `types-complete.log` |
| Unitários |17/17 em 7 arquivos | `unit-complete.log` |
| Integração no navegador |122/122; 0 falhas, 0 pulos, 0 flaky | `final-tests.json`, `final-tests.log` |
| Entrada após último ajuste |6/6 desktop/mobile | `inert-tests.json`, `inert-browser/` |
| Layout adicional |31 casos: 28 com Axe/overflow/clique disponível e 3 composições 3D | `layout/report.json`, `layout/` |
| Assets locais |39 entradas, tamanhos e hashes conferidos | `assets.json` |
| GLB estrutural |24 arquivos; 0 erros e 9 avisos legados | `gltf-validation.json` |
| Segurança de dependências | Produção: 0 advisories; desenvolvimento: 1 advisory em 5 nós | `npm-audit-production.json`, `npm-audit-all.json` |
| Estabilidade |20 voltas III↔VII, 42 amostras; mesmo Canvas, gaveta/editor/foco aprovados | `stability.json`, `stability.log` |
| Navegador público |4/4: I e IV em desktop/mobile; animação, resposta e retomada | `public/SMOKE-PUBLICO.json`, `public.log` |
| Script de captura |2/2: I desktop/mobile, sem erros e sem alterar assets | `script-capture/report.json`, `poster-script.log` |
| Arquivos públicos |39/39 com bytes/hashes iguais; 11 rotas 200 | `public-assets.json` |

Comandos utilizados:

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev --json
npm audit --json
PLAYWRIGHT_BROWSERS_PATH=/workspace/.playwright CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e -- --workers=1 --reporter=line,json
```

A medição prolongada manteve III com 21–22 geometrias/12 texturas e VII com 45 geometrias/16 texturas após a liberação. O teste verifica retorno aos limites em até 8 segundos, com o descarte ocioso do R3F, e mantém a tolerância original de +2 recursos. Os picos transitórios e leituras antigas foram conservados para comparação; não são tratados como bytes de VRAM. A tentativa intermediária que ainda capturava 48 no VII ficou em `stability-second.log/json`.

Verificações adicionais: hashes/tamanhos dos manifestos; validador Khronos dos 24 GLBs; API Vercel somente leitura; download e comparação de 39 assets públicos;11 rotas públicas HTTP 200; navegador real servido em produção; auditoria de layouts e recursos.

A API Vercel confirmou produção `READY` no commit `49dfe27b72710e5c0ecbf34efb981f3bb6c9fc66`, deployment `dpl_nBNvKgd2Uf96GWJvjbRUxy19ZN49`; GitHub main também permanece nesse SHA. As quatro verificações públicas usaram respostas HTTPS reais do domínio, pelo proxy da sessão e com TLS validado. Não utilizaram a aplicação local para cumprir as requisições. A produção de partida carrega o 3D após clicar; o novo pré-carregamento antes do clique só está na branch auditada. Os smokes públicos aprovados não eliminam os defeitos AUD01/AUD02/AUD07 presentes nesse código antigo.

Os perfis de teste são temporários, sem fichas reais. Testes de falha injetam bloqueio WebGL, erro de IndexedDB, ausência de rede, asset 404, download parado, frames interrompidos e confirmação assíncrona nunca completada. Erros de rede/contexto esperados nesses cenários são distintos de erros inesperados em navegação normal.

## E. Revisão visual

A galeria reúne **81 capturas reais** em `capturas/`, `capturas.json` e `galeria.html`. O arquivo `capturas.zip` inclui relatório, galeria e imagens. As evidências são entregues fora da árvore Git, em `/workspace/hogwarts-project-notes/audit-2026-10-16`. Imagens não são mocks de CSS nem renders gerados por IA. O pacote da galeria reúne as imagens e o HTML para consulta fora do ambiente.

Inspeção já realizada dos sete capítulos desktop: objetos principais presentes; moldura/reflexo do espelho legíveis; esfera dominante com ampulheta secundária sem mancha preta; pergaminho em II, pena em III e mesa/caixa em VII preservados. Documento HTML ocupa posição legível; conteúdos extensos usam rolagem própria. A câmera estabiliza para edição. Conferidos também 768×1024, 1024×768 e 1920×1080 com espelho 3D. Em 320×568, as capturas após rolar até Continuar documentam o acesso à ação; o cabeçalho pode estar fora da área visível por causa dessa rolagem, sem corte permanente de conteúdo.

## F. Funcionalidades incompletas e limites reais

- Não há funcionamento integral em primeiro acesso totalmente offline: não existe service worker/PWA que instale o aplicativo. Uma experiência já carregada consegue editar/gravar localmente sem conexão; isso é diferente de abrir o site sem rede.
- Não existe sincronização entre perfis/dispositivos ou resolução de edição simultânea em várias abas. O produto informa isso; troca de dispositivo depende de backup/restauração.
- O armazenamento do navegador não substitui backup. Escritas cadastrais e narrativas usam bancos separados; falhas interrompidas não têm uma transação atômica abrangendo os dois. Avisos e exportação em memória mitigam a perda de alterações ainda não confirmadas.
- Sem testes em aparelhos físicos, Safari, Firefox ou no PC/driver específico do amigo. Chromium com viewport móvel não valida o teclado físico de iOS nem desempenho de GPU real. Redimensionamento de viewport simula espaço de teclado.
- A revisão de narrativa conferiu coerência interna, rótulos de proveniência e preservação do conteúdo. Não reconstruiu uma enciclopédia canônica externa nem modificou as adaptações autorizadas da campanha.
- Algumas licenças/autorias fornecidas continuam ausentes nos originais (caixa, pergaminho, corredor/fundos); os manifestos registram ausência. O espelho declara Sketchfab Standard. Não foram reclassificados como CC0 nem investigadas novas fontes por fora da rede autorizada.
- A validação de recursos conta geometrias/texturas reportadas pelo renderer; não mede bytes reais de VRAM, bateria ou horas de uso em hardware físico.
- CI remoto não equivale à execução local e não foi declarado aprovado sem consultar seus resultados.
- A aprovação de publicação permanece pendente por instrução expressa deste pedido. A produção continua 49dfe27 até autorização; não foi criado outro projeto Vercel.

## G. Melhorias propostas separadamente

Não implementadas automaticamente:

1. Testar com o PC/Brave/driver do relato e celulares físicos representativos; coletar tempos de preparação, frames e falhas reais.
2. Avaliar variantes móveis menores para esfera/ampulheta e maior compressão de mapas preservando o aspecto original; medir antes de trocar assets.
3. Unificar gravação de registro/história numa transação atômica com migração compatível e proteção para múltiplas abas.
4. Atualizar o advisory de desenvolvimento assim que existir correção compatível; revisar os avisos de tangentes se aparecer diferença entre navegadores.
5. Caso se deseje instalação/abertura sem rede, propor PWA e estratégia explícita de cache/atualização, sem confundir com autosave local.
6. Caso se deseje sincronização/autenticação, projetar autorização real e consentimento de envio das fichas; não basta colocar PIN no painel local.
7. Personalização integral de carta/endereço pode ser uma evolução separada. Não foi acrescentada nesta auditoria nem usado o candidato em espera.

## H. Estado final

A branch `audit/full-project-2026-10-16` contém o pré-carregamento solicitado e as três correções de comportamento demonstradas. Main e produção permanecem 49dfe27. Não houve push, merge, criação de projeto Vercel ou alteração das variáveis de produção.

Build, lint, tipos, 17 unitários, 122 cenários integrais, 6 repetições da entrada final, 31 layouts adicionais, 20 voltas de estabilidade e 4 smokes públicos foram aprovados. A exportação/importação JSON e a preservação dos dados foram exercitadas com personagens fictícios. 89 arquivos protegidos de conteúdo, biblioteca de dados e assets mantêm os hashes originais. A carta candidata continua fora do aplicativo.

Os comprovantes finais de commit, arquivo de fontes e Git bundle ficam em `RESULTADO.json` e `BACKUPS.json`; as fontes são conferidas byte por byte contra os blobs do commit, e o bundle passa por `git bundle verify`. Arquivos antigos, fontes originais e evidências de falhas permanecem preservados. O backup de código não inclui nem substitui as fichas reais de IndexedDB.

Permanecem os limites da seção F: advisory de desenvolvimento sem correção compatível disponível, avisos estruturais legados de tangentes, ausência de teste em hardware físico/Safari/Firefox, sincronização e primeira abertura offline. A aprovação do CI remoto não foi presumida.

As instruções de retomada foram salvas como rascunho da configuração da nuvem, preservando instalação, rede e credenciais. Para ativá-las em outra sessão, revisar e salvar o rascunho e publicar **o ambiente** é uma etapa separada da publicação do site. O rascunho não executa scripts, não ativa snapshot nem comprova restauração de commits locais em uma tarefa nova; essa restauração continua sem validação. As cópias portáteis são entregues para recuperação independente.
