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
npm run db:seed -- --teste       # opcional, só para TESTE: 16 clubes fictícios (recusa se já houver clubes)
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
npm run db:simular -- 6 --teste  # só para TESTE: resultados aleatórios nas 6 primeiras rodadas
npm run db:limpar -- --sim      # apaga tudo da liga e recomeça do 1
```

## Painel admin (fase 2)

Endereço: `/admin` (no PC, http://localhost:3000/admin).

```bash
npm run admin:criar -- seu@email.com "Seu nome"   # cria o login e mostra a senha gerada
npm run admin:senha -- seu@email.com              # gera uma senha nova
npm run db:limpar -- --sim                        # apaga tudo da liga e recomeça do 1 (mantém a Equipe e o regulamento; --equipe deixa só o dono)
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
5. Antes de divulgar, apague os dados de teste no PC com `npm run db:limpar -- --sim` (mantém a Equipe e o regulamento) e cadastre a temporada e a competição de verdade no admin.

Depois disso, todo `git push` na branch `main` publica sozinho. O domínio `.com.br` entra em **Settings > Domains**.

## Divulgação por competição

Na ficha de cada competição, a seção **Artes e textos para divulgar** gera tudo a partir da ficha (taxa, prêmio, prazo, formato e situação das inscrições):

- Artes em PNG: `/divulgacao/ID/feed` (1080 × 1350), `/story` (1080 × 1920, faixa 1340–1640 livre para o adesivo de link), `/x` (1600 × 900) e `/og` (1200 × 630). `?baixar=1` salva o arquivo.
- Título conforme a situação: "Inscrições abertas", "Inscrições em breve" ou "Acompanhe a liga/copa". Sem prêmio na ficha, a linha some; sem taxa, sai "Inscrição gratuita".
- Textos prontos para WhatsApp, Instagram e X (o do X sempre cabe em 280 caracteres).
- O link de inscrição da competição (`/i/ID`) mostra a arte dela na prévia do WhatsApp e do X.
- Geradas com o `ImageResponse` do Next.js; a fonte Inter vai em WOFF em `public/fontes` (o gerador não lê woff2).

## Equipe e acesso

No admin, **Equipe** (só o dono vê) lista quem tem acesso e a quais áreas: Competições, Resultados, Clubes, Notícias, Regulamento, Temporada e OBS. Todo mundo vê o Painel. O dono acessa tudo e é o único que mexe na Equipe; não pode ser removido.

- Adicionar pessoa: nome, e-mail e áreas. A senha é gerada e aparece uma vez só, com botão de copiar.
- Senha nova e remover: as sessões abertas da pessoa caem na hora (a versão da sessão vai no cookie).
- Minha conta (clicando no nome, embaixo do menu): cada um troca a própria senha.
- O acesso é checado no servidor em toda página e ação, não só no menu.
- Comandos de emergência no PC: `npm run admin:criar` (a primeira pessoa vira dona), `npm run admin:senha -- email` e `npm run admin:dono -- email`.
- A migração `0003_equipe` faz o primeiro usuário virar dono e dá todas as áreas a quem já existia: ninguém perde acesso no deploy.

## Sessão do painel

O login dura **8 horas** desde a entrada, mesmo usando. Sessões com prazo maior (criadas pela regra antiga de 7 dias) são recusadas, então todo mundo é deslogado uma vez no deploy.

## Cenas do OBS (hospedadas no site)

**Liga na live:** no topo da página OBS do admin, um botão liga ou desliga tudo da liga em todas as cenas de uma vez (card, revezamento da pausa, letreiro, QR, rodapé e campeão), com os mesmos links. Muda em até 20 s. Desligada, `/obs/dados` não devolve nada da liga.

**Senha do OBS:** a página OBS pede a senha da variável `OBS_SENHA` (mínimo 8 caracteres), separada do login. Abrir libera por 10 minutos; ligar ou desligar a liga pede a senha de novo, sempre. O estado do botão fica na tabela `configuracoes` (migração `0002`).

No admin, a página **OBS** lista tudo por categoria, com o link pronto para copiar e a posição da webcam de cada cena. Em todas: fonte de Navegador, "Arquivo local" desmarcado, 1920 × 1080, posição 0/0, escala 1.

```
public/obs/
  cenas/        as cenas do canal (mesmos nomes de arquivo do pacote do OBS)
    00_abertura.html            ?minutos=3 (padrão)
    01_gameplay_clean.html      versão anterior (câmera X 1440, Y 58)
    01a..01d_gameplay_*.html    câmera nos 4 cantos
    01e_gameplay_cam_meio_esq   câmera no meio à esquerda (X 12, Y 423)
    01f_gameplay_cam_meio_dir   câmera no meio à direita (X 1486, Y 423)
    02_just_chatting.html       câmera em tela cheia, chat transparente
    02_just_chatting_moldura    versão antiga, com moldura
    03_pausa.html               ?minutos=5 (padrão)
    04_encerramento.html
    05_alerta_teste.html        só para teste visual
  assets/       logo.png (rosto), moeda.png, thecoinsquash-coin.svg
  cpl.js, cpl.css   peças da liga nas cenas (card, revezamento, QR), na identidade do canal
```

- Gameplay e Just Chatting: o card da liga aparece no canto de baixo oposto à câmera (1 min depois de a cena abrir, depois a cada 10 min, por 12 s; resultado novo aparece na hora). Opções no link: `a_cada`, `duracao`.
- Pausa: a faixa de baixo reveza os recados com a liga; QR das inscrições à direita (espelhando o do LivePix).
- Abertura: frases da liga no letreiro; QR das inscrições à direita.
- `?teste=1` em qualquer cena usa dados de exemplo. `&c=ID` mostra outra competição.
- Peças avulsas: `/obs/campeao` (cena do campeão), `/obs/card?cena=01a`, `/obs/rodape` (não usar em cena que já tem faixa embaixo).
- Tudo em JavaScript de 2017 (roda em qualquer OBS) e com os nomes entrando como texto, nunca como HTML.
- Ficam fora do site: a transição (`07_transicao.webm`, o stinger do OBS precisa de arquivo local) e o banner offline (vai direto na Twitch).

## Fases

- [x] **Fase 1** — banco, regras do regulamento e testes
- [x] **Fase 2** — painel admin com login: competições, inscrições, elencos, partidas e resultados, notícias, regulamento, upload de escudos
- [x] **Fase 3** — site público (A Liga, Regulamento, Tabela) e formulário de inscrição
- [x] **Fase 4** — telas do OBS: rodapé de resultados, card periódico no gameplay, banner do campeão
