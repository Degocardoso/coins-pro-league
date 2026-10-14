"use client";
// VIEW — formulário de inscrição de clube (elenco de 7 a 18 atletas, 2 capitães)
import { startTransition, useActionState, useState } from "react";
import { inscreverClube } from "@/controllers/acoes/inscricao";
import { ELENCO_MAXIMO, ELENCO_MINIMO } from "@/controllers/regras/elenco";

export type CompeticaoAberta = { id: number; nome: string; soSubs: boolean; fechaEm: string | null };

export function FormInscricao({ competicoes }: { competicoes: CompeticaoAberta[] }) {
  const [estado, executar, enviando] = useActionState(inscreverClube, null);
  const [linhas, setLinhas] = useState(() => Array.from({ length: ELENCO_MINIMO }, (_, i) => i));
  const [proxima, setProxima] = useState(ELENCO_MINIMO);
  const [capitaes, setCapitaes] = useState<Set<number>>(new Set());
  const [compId, setCompId] = useState(competicoes[0]?.id ?? 0);
  const comp = competicoes.find((c) => c.id === compId);
  const [sub, setSub] = useState(!!comp?.soSubs);

  if (estado?.ok)
    return (
      <div className="aviso aviso-ok" role="status">
        {estado.ok} Enquanto isso, leia o <a href="/regulamento">regulamento</a> com o seu elenco.
      </div>
    );

  const marcarCapitao = (linha: number, marcado: boolean) =>
    setCapitaes((atual) => {
      const novo = new Set(atual);
      if (marcado) novo.add(linha);
      else novo.delete(linha);
      return novo;
    });

  return (
    <form
      className="form-inscricao"
      onSubmit={(e) => {
        e.preventDefault();
        if (enviando) return;
        const dados = new FormData(e.currentTarget);
        startTransition(() => executar(dados));
      }}
    >
      {competicoes.length > 1 ? (
        <label className="campo-site">
          <span>Competição</span>
          <select name="competicaoId" value={compId} onChange={(e) => setCompId(Number(e.target.value))}>
            {competicoes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </label>
      ) : (
        <input type="hidden" name="competicaoId" value={compId} />
      )}
      {comp?.soSubs && (
        <p className="aviso aviso-info">Neste momento, as inscrições estão abertas só para clubes com capitão sub do canal.</p>
      )}

      <fieldset>
        <legend>Clube</legend>
        <div className="linha-2">
          <label className="campo-site">
            <span>Nome do clube</span>
            <input type="text" name="nomeClube" required minLength={2} maxLength={60} autoComplete="off" />
          </label>
          <label className="campo-site">
            <span>Escudo (quadrado, ideal 512 × 512 px; PNG, JPG ou WEBP até 3 MB)</span>
            <input type="file" name="escudo" accept="image/png,image/jpeg,image/webp" required />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Elenco</legend>
        <p className="nota">
          De {ELENCO_MINIMO} a {ELENCO_MAXIMO} atletas. Marque os 2 capitães ({capitaes.size} de 2 marcados). O nome do
          personagem é o que aparece no jogo e não pode mudar durante a temporada.
        </p>
        <div className="cabeca-atletas" aria-hidden>
          <span />
          <span>Nome do personagem</span>
          <span>Plataforma</span>
          <span>PSN ID, Gamertag ou EA ID</span>
          <span>Capitão</span>
          <span />
        </div>
        <div className="linhas-atletas">
          {linhas.map((id, n) => (
            <div key={id} className="linha-atleta">
              <span className="num">{n + 1}</span>
              <input type="text" name={`a${id}_nome`} required maxLength={40} placeholder="Nome do personagem" aria-label={`Atleta ${n + 1}: nome do personagem`} />
              <select name={`a${id}_plat`} defaultValue="ps5" aria-label={`Atleta ${n + 1}: plataforma`}>
                <option value="ps5">PS5</option>
                <option value="xbox">Xbox</option>
                <option value="pc">PC</option>
              </select>
              <input type="text" name={`a${id}_id`} required maxLength={60} placeholder="ID na plataforma" aria-label={`Atleta ${n + 1}: ID na plataforma`} />
              <label className="cap">
                <input
                  type="checkbox"
                  name={`a${id}_cap`}
                  checked={capitaes.has(id)}
                  disabled={!capitaes.has(id) && capitaes.size >= 2}
                  onChange={(e) => marcarCapitao(id, e.target.checked)}
                />
                Capitão
              </label>
              {linhas.length > ELENCO_MINIMO ? (
                <button type="button" className="remover" onClick={() => { setLinhas((l) => l.filter((x) => x !== id)); marcarCapitao(id, false); }}>
                  Remover
                </button>
              ) : (
                <span />
              )}
            </div>
          ))}
        </div>
        {linhas.length < ELENCO_MAXIMO && (
          <p>
            <button type="button" className="botao botao-sec" onClick={() => { setLinhas((l) => [...l, proxima]); setProxima((p) => p + 1); }}>
              Adicionar atleta
            </button>
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend>Capitão sub</legend>
        <label className="marcar-site">
          <input type="checkbox" name="capitaoSub" checked={sub} onChange={(e) => setSub(e.target.checked)} />
          <span>Um dos capitães é sub do canal thecoinsquash na Twitch (dá prioridade na inscrição)</span>
        </label>
        {sub && (
          <label className="campo-site" style={{ maxWidth: 420 }}>
            <span>Usuário da Twitch do capitão sub</span>
            <input type="text" name="twitch" required maxLength={40} placeholder="seu_usuario" />
          </label>
        )}
      </fieldset>

      <div className="honeypot" aria-hidden>
        <label>Não preencha<input type="text" name="site" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <label className="marcar-site">
        <input type="checkbox" name="aceite" required />
        <span>Li e aceito o <a href="/regulamento" target="_blank">regulamento</a>, em nome de todo o elenco.</span>
      </label>

      {estado?.erros?.length ? (
        <div className="aviso aviso-erro" role="alert">
          {estado.erros.length === 1 ? estado.erros[0] : <ul>{estado.erros.map((e) => <li key={e}>{e}</li>)}</ul>}
        </div>
      ) : null}

      <p><button type="submit" className="botao" disabled={enviando}>{enviando ? "Enviando…" : "Enviar inscrição"}</button></p>
    </form>
  );
}
