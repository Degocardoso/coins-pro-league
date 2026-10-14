# Coin's Pro League — site e sistema da liga

Next.js + TypeScript, PostgreSQL (Supabase) com Drizzle ORM, organizado em MVC.

## Estrutura MVC

```
src/
  models/                 MODEL
    schema.ts             tabelas do banco
    db.ts                 conexão (Supabase via postgres-js)
    repositories/         consultas usadas pelos controllers
  controllers/            CONTROLLER
    CompeticaoController  gera a tabela da liga (30 rodadas) e a chave da copa, confirma inscrições
    PartidaController     agenda, lança resultado com estatísticas, aplica W.O.
    ElencoController      entrada e saída de atletas (janela, 7 a 18, 1 clube por atleta)
    ClassificacaoController  classificação e rankings com nomes
    regras/               regras puras do regulamento (sem banco), cobertas por testes
  views/                  VIEW (componentes React, fases 2 e 3)
  app/                    rotas do Next: só recebem a requisição, chamam o controller e renderizam a view
drizzle/                  migrações SQL geradas
scripts/                  seed com 16 clubes fictícios
tests/                    testes das regras e de integração (Postgres em memória)
```

## Onde cada regra do regulamento está no código

| Regulamento | Arquivo |
| --- | --- |
| 3. Pontuação e desempate (vitórias, saldo, gols pró, confronto direto, sorteio) | `regras/classificacao.ts` |
| 3. Liga ida e volta, 16 clubes = 30 rodadas | `regras/tabela.ts` |
| 3. Copa em jogo único, prorrogação e pênaltis, folgas | `regras/copa.ts` |
| 4, 5, 6. Inscrição, 16 vagas, prioridade sub, elenco 7 a 18, janela | `regras/elenco.ts` |
| 8, 10. Placar, estatísticas, mínimo de 5 humanos, atleta irregular | `regras/resultado.ts` |
| 10. Rankings: gols, pênaltis, assistências, MVP, sem sofrer gol (só goleiro humano) | `regras/rankings.ts` |
| 11. Vermelho = 1 jogo na próxima partida do clube | `regras/resultado.ts` + `PartidaController` |

## Rodar local

```bash
npm install          # o .npmrc já liga legacy-peer-deps
npm test             # testes automáticos, sem precisar de banco
npm run typecheck
```

## Subir o banco no Supabase (grátis)

1. Crie um projeto em supabase.com, região São Paulo.
2. Em **Project Settings > Database > Connection string**, copie duas URLs:
   - **Transaction pooler** (porta 6543) → `DATABASE_URL`, usada pelo site.
   - **Session pooler** (porta 5432) → `DATABASE_URL_MIGRACAO`, usada nas migrações.
3. Copie `.env.example` para `.env` e cole as duas URLs com a sua senha.
4. Rode:

```bash
npm run db:migrate   # cria as tabelas
npm run db:seed      # opcional: 16 clubes fictícios + tabela gerada
```

Observação: projeto grátis do Supabase pausa depois de uma semana sem acesso. Com a liga rodando isso não acontece; se pausar, é só reativar no painel.

## Site público (fase 3)

Quatro abas: **A Liga** (`/`), **Regulamento** (`/regulamento`), **Tabela** (`/tabela`) e **Notícias** (`/noticias`, o Jornal da Liga), mais o formulário de inscrição (`/inscricao`).

- Cada notícia tem página própria (`/noticias/<id>`), com título, resumo e imagem no preview quando o link é compartilhado. Com domínio próprio, defina `SITE_URL` (ex.: `https://coinsproleague.com.br`) na Vercel; sem ele, a Vercel usa o endereço `.vercel.app` sozinha.
- No texto da notícia, uma linha em branco separa parágrafos.
- Privacidade: o site público mostra só o nome do personagem e a plataforma. PSN ID, Gamertag, EA ID e Twitch ficam só no painel admin.

- A inscrição só aparece com a competição na situação "Inscrições abertas" (ficha no admin). Com as datas preenchidas, ela abre primeiro para clubes com capitão sub e depois para todos.
- O formulário cria o clube novo, o elenco e a inscrição pendente de uma vez. Se qualquer atleta der problema, nada é gravado.
- Clube que já existe (por exemplo, um clube da liga entrando numa copa) é inscrito pelo admin, na ficha da competição.
- Para ver o site com cara de liga rodando antes da hora:

```bash
npm run db:simular -- 6     # resultados aleatórios nas 6 primeiras rodadas
npm run db:limpar -- --sim  # apaga tudo depois
```

## Painel admin (fase 2)

Endereço: `/admin` (no PC, http://localhost:3000/admin).

```bash
npm run admin:criar -- seu@email.com "Seu nome"   # cria o login e mostra a senha gerada
npm run admin:senha -- seu@email.com              # gera uma senha nova
npm run db:limpar -- --sim                        # apaga os dados de teste (mantém admins e regulamento)
```

O login precisa da variável `SESSION_SECRET` no `.env` e na Vercel. Gere uma com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Tema claro e escuro: botões no rodapé do menu (e na tela de login). Sem escolha salva, segue o tema do sistema. As cores ficam todas em `src/views/estilos/tokens.css`, com um valor por tema; as telas nunca usam cor fixa.

As imagens (escudos, banner do campeão, fotos das notícias) ficam no próprio banco e são servidas em `/arquivos/<id>`. Aceita PNG, JPG e WEBP de até 3 MB.

## Deploy na Vercel

A conexão com o banco segue a recomendação da Vercel para o Fluid compute: driver `pg` com pool pequeno, conexões paradas fechando em 5 s e `attachDatabasePool`, que fecha as conexões antes de a função dormir. Consulta travada vira erro em 15 s, em vez de página carregando para sempre.

O `vercel.json` já fixa as funções em São Paulo (`gru1`), perto do banco do Supabase. Sem isso, a Vercel roda nos EUA e cada consulta atravessa o continente.

1. Suba o projeto para um repositório no GitHub (o `.gitignore` já deixa o `.env` de fora).
2. Na Vercel, **Add New > Project** e escolha o repositório. Se a pasta do projeto não for a raiz do repositório, aponte o **Root Directory** para ela.
3. Em **Environment Variables**, adicione:
   - `DATABASE_URL`: a do Transaction pooler (porta 6543)
   - `SESSION_SECRET`: a mesma do seu `.env` (ou uma nova)
   - `SITE_URL`: só quando tiver domínio próprio
4. Deploy. O endereço sai como `<nome>.vercel.app`. O login do admin é o mesmo do seu PC, porque o banco é o mesmo.
5. Antes de divulgar, apague os dados de teste no PC com `npm run db:limpar -- --sim` (mantém admins e regulamento) e cadastre a temporada e a competição de verdade no admin.

Depois disso, todo `git push` na branch `main` publica sozinho. O domínio `.com.br` entra em **Settings > Domains**.

## Telas do OBS (fase 4)

No admin, a página **OBS** tem todos os links prontos para copiar. Em todas: fonte de Navegador, 1920 × 1080, posição 0/0, escala 1.

| Tela | Link | Onde usar |
| --- | --- | --- |
| Rodapé estilo ESPN | `/obs/rodape` | Just Chatting, pausa e abertura (faixa de Y 996 a 1060) |
| Card do gameplay | `/obs/card?cena=01a` (01a a 01d) | Cada cena de gameplay; entra no canto inferior oposto ao da câmera |
| Campeão | `/obs/campeao` | Cena inteira, quando a competição estiver Encerrada |

- Opções do card: `a_cada` (minutos, padrão 10) e `duracao` (segundos, padrão 12). Ex.: `/obs/card?cena=01b&a_cada=15`.
- Todas aceitam `teste=1` (dados de exemplo) para posicionar antes da liga começar, e `c=ID` para mostrar outra competição.
- São HTML puro com JavaScript simples (roda até em OBS antigo) e buscam `/obs/dados` a cada 20 s, sem cache. Os nomes entram como texto, nunca como HTML.
- "Últimos resultados" são os lançados mais recentemente, de qualquer rodada. Resultado novo: o rodapé recomeça por ele (com o selo "novo" por 15 minutos) e o card do gameplay aparece na hora com "Acabou de sair".
- Se algo não atualizar, abra `/obs/dados` no navegador: se o resultado está lá, confira se a fonte do OBS não está com `teste=1` no link.

## Fases

- [x] **Fase 1** — banco, regras do regulamento e testes
- [x] **Fase 2** — painel admin com login: competições, inscrições, elencos, partidas e resultados, notícias, regulamento, upload de escudos
- [x] **Fase 3** — site público (A Liga, Regulamento, Tabela) e formulário de inscrição
- [x] **Fase 4** — telas do OBS: rodapé de resultados, card periódico no gameplay, banner do campeão
