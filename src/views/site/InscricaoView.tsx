// VIEW — página de inscrição
import type { InscricaoController } from "@/controllers/InscricaoController";
import { formatarDataHora } from "@/lib/datas";
import { FormInscricao } from "./FormInscricao";

type Abertas = Awaited<ReturnType<InscricaoController["abertas"]>>;

export function InscricaoView({ abertas }: { abertas: Abertas }) {
  const fecha = abertas.length === 1 && abertas[0].situacao.aberta ? abertas[0].situacao.fechaEm : null;
  const qual = abertas.length === 1 ? `Inscrição para a ${abertas[0].competicao.nome}. ` : "";
  return (
    <>
      <h1 className="titulo-liga" style={{ fontSize: "clamp(40px, 6vw, 64px)" }}>Inscrever clube</h1>
      {abertas.length === 0 ? (
        <p className="lead" style={{ color: "var(--apagado)", marginTop: 16 }}>
          As inscrições estão fechadas no momento. Acompanhe a data de abertura na aba <a href="/">A Liga</a>.
        </p>
      ) : (
        <>
          <p className="nota" style={{ margin: "12px 0 32px", fontSize: 16 }}>
            {qual}A inscrição entra como pendente. A organização confere os dados e confirma a vaga no Discord
            {fecha ? `. Inscrições até ${formatarDataHora(fecha)}.` : "."}
          </p>
          <FormInscricao
            competicoes={abertas.map((a) => ({
              id: a.competicao.id,
              nome: a.competicao.nome,
              soSubs: a.situacao.aberta && a.situacao.soSubs,
              fechaEm: a.situacao.aberta && a.situacao.fechaEm ? a.situacao.fechaEm.toISOString() : null,
            }))}
          />
        </>
      )}
    </>
  );
}
