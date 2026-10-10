# Dados, autoria e recuperação

O contrato de personagem está implementado em `src/lib/story.ts` e validado com Zod. `answers` usa IDs de perguntas; estados possíveis: `answered`, `skipped`, `not_applicable`, `prefer_not_to_answer`, `unknown`. Ao exportar, textos de respostas não respondidas são excluídos do JSON final, mas ficam no backup privado do rascunho. A explicação de VII05 fica fora da exportação quando a escolha passa a “Não”. Dados de uma família original ficam preservados no rascunho e não são exportados ao selecionar outra família.

`schemaVersion: "1.0.0"`, campanha `hogwarts-1890`, ano 1890. O ID do personagem permanece estável entre exportações. A revisão incrementa em cada exportação. Relações, objetos e oportunidades têm IDs próprios; referências inválidas ou duplicadas são rejeitadas na importação. Não há atributos, Casa ou varinha atribuídos pelo aplicativo.

O jogador cria oportunidades explicitamente. Cada uma separa fatos, crenças, pergunta, restrições, interesse e permissão (`closed`, `details`, `explanation`, `broad`). Apenas `exploreInCampaign: "yes"` com permissão diferente de `closed` conta como oportunidade autorizada. `maybe` exige conversa. Nenhuma permissão autoriza contradizer fatos ou limites.

## Arquivos

- Ficha final: `hogwarts-1890-personagem-<nome>-v<revisão>.json`.
- Backup do jogador: `hogwarts-player-backup`, versão 1, inclui registro e história inteira; restaurável no jogador.
- Backup antigo do registro: `hogwarts-admission-draft`, versão 1; restaurável em “Backup do registro da primeira versão”, no Capítulo I.
- Backup do Mestre: `hogwarts-master-backup`, versão 1, inclui JSONs originais, índices, notas e conexões confirmadas; restaurável no Mestre.

Fichas importadas: até 2 MB cada. Backup do Mestre: até 20 MB. Backup completo do jogador: até 2 MB. Textos limitados a 5.000 caracteres; nomes de relações/objetos/oportunidades a 200. Mensagens de validação não incluem os textos privados.

## Armazenamento

O registro da fase 1 permanece no IndexedDB `hogwarts-player`; a história usa `hogwarts-narrative`, por ID de personagem. O Mestre usa `hogwarts-master` e não altera os registros do jogador. A interface de persistência é substituível em `src/lib/local-store.ts`.

A fila serializa gravações, e avisos indicam alterações não salvas ou falhas de armazenamento. Se o navegador estiver sem espaço ou bloquear IndexedDB, exporte um backup antes de sair. A continuidade em outro dispositivo é feita por arquivos, não por sincronização automática. Evite edição concorrente em várias abas.

O Mestre preserva o texto bruto de cada importação e valida a correspondência com o índice no backup. A troca de revisão exige decisão explícita; a revisão anterior não é sobrescrita silenciosamente. “Confirmado” em uma nota do Mestre não muda o JSON do jogador. Nomes e lugares iguais são apenas possíveis conexões até confirmação manual; não provam identidade nem inventam eventos.
