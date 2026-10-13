// Validação de imagens enviadas: confere o conteúdo real do arquivo, não só a extensão.
export const TAMANHO_MAXIMO = 3 * 1024 * 1024; // 3 MB

export type TipoImagem = "image/png" | "image/jpeg" | "image/webp";

export function detectarTipo(bytes: Uint8Array): TipoImagem | null {
  const b = bytes;
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  const ascii = (i: number, n: number) => String.fromCharCode(...b.slice(i, i + n));
  if (b.length > 12 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return "image/webp";
  return null;
}

export function validarImagem(bytes: Uint8Array): { tipo: TipoImagem } | { erro: string } {
  if (bytes.length === 0) return { erro: "Arquivo vazio." };
  if (bytes.length > TAMANHO_MAXIMO) return { erro: "Imagem maior que 3 MB." };
  const tipo = detectarTipo(bytes);
  if (!tipo) return { erro: "Formato não aceito. Envie PNG, JPG ou WEBP." };
  return { tipo };
}
