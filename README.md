# Carta para Hogwarts · 1890

Aplicativo narrativo em português brasileiro para criar personagens em sete capítulos e entregar fichas JSON ao Mestre. Next.js App Router, React, TypeScript, Tailwind CSS, Zod e IndexedDB. Sem banco de dados em servidor, analytics de conteúdo ou APIs de IA.

## Executar

Requisitos: Node.js 22 ou superior e npm. Use o checkout existente; não é necessário criar worktree.

```sh
npm ci
npm run dev
```

Rotas: `/` (tela de início e retomada por clique), `/experiencia` (criação cinematográfica fullscreen com a mesma tela de início), `/criar/I` a `/criar/VII` (editores compatíveis), `/revisao` (revisão/exportação), `/mestre` (arquivo local do Mestre).

```sh
npm run lint
npm test
npm run build
npm run typecheck
PLAYWRIGHT_BROWSERS_PATH=/workspace/.playwright CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e -- --workers=1
```

Neste ambiente, o Chromium já está instalado. Em outra máquina, use `npx playwright install chromium` e `npm run test:e2e`. Para servir a build: `npm run start`. Os testes de navegador iniciam e encerram seu próprio servidor na porta 3000; pare primeiro somente servidores que você iniciou nessa porta. Os testes não dependem de serviços externos.

## Funcionalidades

- Tela de início explícito: o cenário 3D se prepara enquanto aguarda “Iniciar experiência” ou “Continuar minha história”, sem tocar a animação. Carta com lacre, abertura silenciosa somente após o clique e a preparação, opção de pular pelo teclado e movimento reduzido.
- Experiência fullscreen com sete composições cinematográficas, campos HTML acessíveis, carta, pergaminho, tinteiro, corredor vitoriano, espelho, esfera armilar e mesa com fotografias; retomada da pergunta salva e navegação entre capítulos. Veja [experiência cinematográfica](docs/EXPERIENCIA.md).
- 61 perguntas principais, seleção de família, extensões contextuais e cenas 3D procedurais com alternativa interativa 2.5D.
- Perguntas opcionais, estados explícitos de resposta, relações e objetos reutilizáveis.
- Fatos, crenças, lacunas, restrições e autorização por oportunidade; nenhuma hipótese automática vira cânone.
- Autosave, recuperação, backups completos e compatibilidade com backups de registro da fase 1.
- Revisão em quatro folhas, preferências/limites e exportação `schemaVersion: "1.0.0"` com ID estável e revisão crescente.
- Mestre: importação múltipla, validação individual, decisão sobre revisões, busca, comparação, filtros, relações, linha do tempo sem datas inventadas, possíveis conexões com confirmação manual, planejamento separado e backup/restauração.

## Dados e privacidade

Os dados ficam no navegador/dispositivo. **Salvamento local não é backup**: baixe cópias regularmente e antes de trocar de navegador/dispositivo ou apagar dados locais. Não edite a mesma história simultaneamente em várias abas; esta versão não sincroniza alterações concorrentes.

O JSON final contém as respostas e limites que você escolheu compartilhar com o Mestre. O backup completo inclui também textos guardados no rascunho que foram pulados ou ficaram ocultos por uma mudança de escolha. Revise o arquivo antes de compartilhá-lo. O Arquivo do Mestre preserva os JSONs originais e mantém suas anotações em um armazenamento separado do jogador.

`/mestre` não tem autenticação. Quem usar o mesmo perfil do navegador poderá acessar as importações; um visitante em outro dispositivo verá o arquivo vazio. Uma futura versão com dados em servidor exigirá autenticação e autorização reais.

O acervo reúne objetos procedurais próprios, modelos CC0 do Poly Haven e os modelos fornecidos pelo proprietário. Na experiência fullscreen, II usa o pergaminho original; III, tinteiro com pena; IV, o corredor completo com chegada animada da carta; V, Ornate Mirror; VI, esfera armilar com ampulheta secundária; VII, mesa vitoriana com a caixa Antique Photo Album e dez fotografias interativas. A caixa conserva seu clipe original; os demais movimentos usam somente as peças identificadas e não são apresentados como clipes incluídos. UVs e texturas originais são preservados nas versões otimizadas, com fontes, licenças declaradas e hashes nos manifestos. Autoria/licença ausentes nos arquivos fornecidos são registradas como desconhecidas, sem atribuição de CC0. Os capítulos I, II, III, V, VI e VII usam outros enquadramentos da arquitetura do corredor como fundo tridimensional, preservando os seus protagonistas. O acervo anterior permanece nas rotas compactas. Veja [cenários e fontes](docs/CENARIOS.md). Animações respeitam `prefers-reduced-motion` e podem ser puladas. Som e WebGL não são necessários para usar o aplicativo.

A especificação integral contém referências reservadas e fica fora do checkout. Nunca copie essa fonte, fichas reais, backups privados ou valores de credenciais para `src`, `public`, fixtures, logs ou variáveis `NEXT_PUBLIC_`.

## Publicação e continuidade

Veja [publicação na Vercel](docs/VERCEL.md) e [contrato de dados](docs/DADOS.md). A Vercel detecta Next.js automaticamente. O código pode ser publicado sem receber fichas de jogadores no servidor.

O registro privado desta máquina fica em `/workspace/hogwarts-project-notes/CONTINUIDADE.md`; os backups do código ficam fora do checkout. O workflow CI executa build, lint, tipos, testes unitários e testes ponta a ponta. Consulte esse registro para a evidência da entrega e o estado da publicação.
