// Discord: usuário do capitão (inscrição) e link de convite da liga (admin)

/** Usuário do Discord: formato novo (fulano, f.ulano_2) ou antigo (Fulano#1234). Aceita "@" na frente. */
export function normalizarUsuarioDiscord(entrada: string): string | null {
  const u = entrada.trim().replace(/^@/, "");
  return /^[A-Za-z0-9_.]{2,32}(#\d{4})?$/.test(u) ? u : null;
}

/** Convite do Discord em qualquer formato comum; devolve sempre https://discord.gg/CODIGO. */
export function normalizarConviteDiscord(entrada: string): string | null {
  const m = /^(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\/([A-Za-z0-9-]{2,64})\/?$/.exec(entrada.trim());
  return m ? `https://discord.gg/${m[1]}` : null;
}
