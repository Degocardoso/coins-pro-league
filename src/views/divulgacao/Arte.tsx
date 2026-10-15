// VIEW — arte de divulgação de uma competição, desenhada pelo ImageResponse (Satori).
// Só flexbox e CSS simples: cada caixa com mais de um filho precisa de display: flex.
import type { CSSProperties, ReactNode } from "react";
import type { ConteudoArte } from "@/controllers/regras/divulgacao";

export const FORMATOS = {
  feed: { largura: 1080, altura: 1350, nome: "Feed (Instagram e WhatsApp)" },
  story: { largura: 1080, altura: 1920, nome: "Story e status" },
  x: { largura: 1600, altura: 900, nome: "Post no X" },
  og: { largura: 1200, altura: 630, nome: "Prévia do link" },
} as const;
export type Formato = keyof typeof FORMATOS;

const VERDE = "#9bdb5c";
const OURO = "#f5b53c";
const TEXTO = "#f7f8fb";
const APAGADO = "#9ea7b6";

const fundo: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  position: "relative",
  color: TEXTO,
  fontFamily: "Inter",
  backgroundColor: "#0b1019",
  backgroundImage:
    "radial-gradient(circle at 50% 28%, rgba(155,219,92,0.16), rgba(155,219,92,0) 42%), radial-gradient(circle at 78% 80%, rgba(245,181,60,0.12), rgba(245,181,60,0) 40%), linear-gradient(135deg, #080b12, #101726)",
};

function Moedas({ origem, posicoes }: { origem: string; posicoes: [number, number, number][] }) {
  return (
    <>
      {posicoes.map(([x, y, t], i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={`${origem}/obs/assets/moeda.png`} width={t} height={t} style={{ position: "absolute", left: x, top: y, opacity: 0.22 }} alt="" />
      ))}
    </>
  );
}

function Rotulo({ children, tamanho }: { children: ReactNode; tamanho: number }) {
  return <div style={{ display: "flex", color: VERDE, fontWeight: 900, fontSize: tamanho, letterSpacing: tamanho * 0.24, textTransform: "uppercase" }}>{children}</div>;
}

function Titulo({ a, tamanho, centro }: { a: ConteudoArte; tamanho: number; centro?: boolean }) {
  const estilo: CSSProperties = { fontWeight: 900, fontSize: tamanho, lineHeight: 0.98, letterSpacing: -tamanho * 0.03, textTransform: "uppercase" };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: centro ? "center" : "flex-start" }}>
      <span style={estilo}>{a.titulo[0]}</span>
      <span style={{ ...estilo, color: OURO, textShadow: "0 0 40px rgba(245,181,60,0.35)" }}>{a.titulo[1]}</span>
    </div>
  );
}

function Nome({ a, tamanho, centro }: { a: ConteudoArte; tamanho: number; centro?: boolean }) {
  if (!a.mostrarNome) return null;
  return (
    <div style={{ display: "flex", fontWeight: 900, fontSize: tamanho, lineHeight: 1.05, letterSpacing: -tamanho * 0.02, textTransform: "uppercase", textAlign: centro ? "center" : "left", maxWidth: "100%" }}>
      {a.nome}
    </div>
  );
}

function Fatos({ a, tamanho }: { a: ConteudoArte; tamanho: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: tamanho * 0.38 }}>
      {a.fatos.map((f) => (
        <div key={f} style={{ display: "flex", alignItems: "center", gap: tamanho * 0.5, fontWeight: 600, fontSize: tamanho }}>
          <div style={{ display: "flex", width: tamanho * 0.36, height: tamanho * 0.36, backgroundColor: VERDE, transform: "rotate(45deg)" }} />
          <span>{f}</span>
        </div>
      ))}
    </div>
  );
}

function Chamada({ a, tamanho }: { a: ConteudoArte; tamanho: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: `${tamanho * 0.6}px ${tamanho * 1.1}px`,
        border: `3px solid rgba(245,181,60,0.85)`,
        borderRadius: 22,
        backgroundColor: "rgba(8,12,20,0.88)",
        boxShadow: "0 0 36px rgba(155,219,92,0.18)",
      }}
    >
      <Rotulo tamanho={tamanho * 0.6}>{a.cta.rotulo}</Rotulo>
      <span style={{ fontWeight: 800, fontSize: tamanho, marginTop: tamanho * 0.2 }}>{a.cta.link}</span>
    </div>
  );
}

function Rodape({ a, tamanho }: { a: ConteudoArte; tamanho: number }) {
  const [antes, depois] = a.rodape.split("twitch.tv");
  return (
    // O Satori descarta o espaço no fim de um trecho: o espaço entre os dois vem do gap
    <div style={{ display: "flex", gap: tamanho * 0.3, fontSize: tamanho, fontWeight: 600, color: APAGADO }}>
      <span>{antes.trim()}</span>
      <span style={{ color: TEXTO, fontWeight: 800 }}>twitch.tv{depois}</span>
    </div>
  );
}

function Logo({ origem, largura }: { origem: string; largura: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`${origem}/liga/logo.png`} width={largura} height={Math.round((largura * 881) / 889)} alt="" />;
}

export function Arte({ a, formato, origem }: { a: ConteudoArte; formato: Formato; origem: string }) {
  if (formato === "feed")
    return (
      <div style={fundo}>
        <Moedas origem={origem} posicoes={[[60, 120, 90], [930, 260, 70], [80, 900, 60], [950, 1000, 96]]} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", padding: "40px 70px" }}>
          <Logo origem={origem} largura={a.mostrarNome ? 420 : 470} />
          <div style={{ display: "flex", marginTop: 18 }}><Rotulo tamanho={22}>{a.eyebrow}</Rotulo></div>
          {a.mostrarNome && <div style={{ display: "flex", marginTop: 14 }}><Nome a={a} tamanho={50} centro /></div>}
          <div style={{ display: "flex", marginTop: 14 }}><Titulo a={a} tamanho={86} centro /></div>
          <div style={{ display: "flex", marginTop: 26 }}><Fatos a={a} tamanho={28} /></div>
          <div style={{ display: "flex", marginTop: 28 }}><Chamada a={a} tamanho={30} /></div>
          <div style={{ display: "flex", marginTop: 20 }}><Rodape a={a} tamanho={21} /></div>
        </div>
      </div>
    );
  if (formato === "story")
    return (
      <div style={fundo}>
        <Moedas origem={origem} posicoes={[[50, 330, 90], [930, 520, 72], [70, 1150, 64], [930, 1200, 96]]} />
        {/* Conteúdo entre 230 e ~1300 px; de 1340 a 1640 fica vazio para o adesivo de link */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", position: "absolute", top: 230, padding: "0 70px" }}>
          <Logo origem={origem} largura={a.mostrarNome ? 400 : 440} />
          <div style={{ display: "flex", marginTop: 18 }}><Rotulo tamanho={23}>{a.eyebrow}</Rotulo></div>
          {a.mostrarNome && <div style={{ display: "flex", marginTop: 14 }}><Nome a={a} tamanho={54} centro /></div>}
          <div style={{ display: "flex", marginTop: 14 }}><Titulo a={a} tamanho={94} centro /></div>
          <div style={{ display: "flex", marginTop: 26 }}><Fatos a={a} tamanho={30} /></div>
        </div>
        <div style={{ display: "flex", position: "absolute", top: 1270, width: "100%", justifyContent: "center" }}>
          <Rotulo tamanho={24}>{a.estado === "andamento" ? "Toque no link para ver a tabela" : "Toque no link para se inscrever"}</Rotulo>
        </div>
        <div style={{ display: "flex", position: "absolute", top: 1680, width: "100%", justifyContent: "center" }}><Rodape a={a} tamanho={26} /></div>
      </div>
    );
  if (formato === "x")
    return (
      <div style={{ ...fundo, alignItems: "center", padding: "0 80px", gap: 56 }}>
        <Moedas origem={origem} posicoes={[[1460, 90, 80], [880, 760, 60], [1480, 720, 90]]} />
        <Logo origem={origem} largura={540} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <Rotulo tamanho={20}>{a.eyebrow}</Rotulo>
          {a.mostrarNome && <div style={{ display: "flex", marginTop: 12 }}><Nome a={a} tamanho={46} /></div>}
          <div style={{ display: "flex", marginTop: 12 }}><Titulo a={a} tamanho={80} /></div>
          <div style={{ display: "flex", marginTop: 22 }}><Fatos a={a} tamanho={25} /></div>
          <div style={{ display: "flex", marginTop: 26 }}><Chamada a={a} tamanho={26} /></div>
        </div>
      </div>
    );
  return (
    <div style={{ ...fundo, alignItems: "center", padding: "0 56px", gap: 40 }}>
      <Moedas origem={origem} posicoes={[[1100, 40, 60], [640, 550, 48]]} />
      <Logo origem={origem} largura={400} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Rotulo tamanho={15}>{a.eyebrow}</Rotulo>
        {a.mostrarNome && <div style={{ display: "flex", marginTop: 10 }}><Nome a={a} tamanho={34} /></div>}
        <div style={{ display: "flex", marginTop: 10 }}><Titulo a={a} tamanho={56} /></div>
        <div style={{ display: "flex", marginTop: 16 }}><Fatos a={a} tamanho={19} /></div>
        <div style={{ display: "flex", marginTop: 16, fontSize: 20, fontWeight: 800 }}>{a.cta.link}</div>
      </div>
    </div>
  );
}
