"use client";
// VIEW — erro ao carregar uma página do site (ex.: banco fora do ar por um instante)
export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <section style={{ padding: "40px 0" }}>
      <h1 className="titulo-liga" style={{ fontSize: "clamp(36px, 6vw, 56px)" }}>Não deu para carregar</h1>
      <p className="lead" style={{ color: "var(--apagado)", margin: "16px 0 24px", maxWidth: "48ch" }}>
        O servidor demorou para responder. Isso costuma passar em segundos.
      </p>
      <button type="button" className="botao" onClick={() => reset()}>Tentar de novo</button>
    </section>
  );
}
