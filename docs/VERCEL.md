# Publicar na Vercel

## Pelo painel

1. Importe `ZeClover/Carta-para-Hogwarts` na sua conta Vercel quando o código estiver no GitHub.
2. Use o preset **Next.js**, diretório raiz do repositório, Node.js 24 (ou 22), comando de instalação `npm ci` e build `npm run build`.
3. O aplicativo não precisa de variáveis secretas em produção. As fichas e notas são armazenadas no navegador do visitante; a Vercel hospeda somente o aplicativo.
4. Após publicar, valide a carta, preenchimento, recarga, download/restauração e o Arquivo do Mestre vazio em outro perfil de navegador. Os testes locais não equivalem a uma validação da implantação pública.

## Pela CLI neste ambiente

A autenticação Vercel precisa estar disponível antes de executar deploy. A exigência `VERCEL_TOKEN` foi registrada nas configurações do ambiente para entrada segura, com destino HTTPS `api.vercel.com`. O token é uma credencial de publicação e não deve entrar no repositório nem nas variáveis públicas do aplicativo.

Com acesso e autenticação configurados, use a CLI oficial para verificar a conta, vincular o projeto e publicar. Preserve o proxy e a verificação TLS. Confirme o projeto/escopo retornados antes de publicar para evitar usar uma conta ou projeto incorretos. Não instale credenciais dentro do aplicativo.

## Arte e dados

O emblema H e as cenas em CSS são placeholders originais. Substitua por artes fornecidas/autorizadas quando disponíveis. Nunca envie backups de jogadores, conteúdo privado do Mestre ou a especificação integral para a pasta do projeto que será publicada.
