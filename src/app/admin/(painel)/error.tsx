"use client";
// VIEW — erro ao carregar uma tela do painel
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <header className="cabeca">
        <h1>Não deu para carregar</h1>
        <p>O servidor ou o banco demorou para responder. Tente de novo em alguns segundos.</p>
      </header>
      <p><button type="button" className="btn btn-ouro" onClick={() => reset()}>Tentar de novo</button></p>
      {error.digest && <p style={{ color: "var(--apagado)", fontSize: 13 }}>Código do erro para os logs da Vercel: {error.digest}</p>}
    </>
  );
}
