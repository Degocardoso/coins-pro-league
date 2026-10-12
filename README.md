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
npm test             # 35 testes, sem precisar de banco
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

## Deploy na Vercel

1. Suba o projeto para um repositório no GitHub.
2. Na Vercel, **Add New > Project**, escolha o repositório.
3. Em **Environment Variables**, adicione `DATABASE_URL` (a do Transaction pooler).
4. Deploy. O endereço sai como `<nome>.vercel.app`; o domínio `.com.br` entra depois em **Settings > Domains**.

## Fases

- [x] **Fase 1** — banco, regras do regulamento e testes
- [ ] **Fase 2** — painel admin com login: competições, inscrições, elencos, partidas e resultados, notícias, regulamento, upload de escudos
- [ ] **Fase 3** — site público (A Liga, Regulamento, Tabela) e formulário de inscrição
- [ ] **Fase 4** — telas do OBS: rodapé de resultados, card periódico no gameplay, banner do campeão
