// VIEW — jornal da liga: lista e formulário
import { excluirNoticia, salvarNoticia } from "@/controllers/acoes/noticia";
import type { noticias } from "@/models/schema";
import { formatarData } from "@/lib/datas";
import { FormAcao, Enviar } from "../FormAcao";
import { Cabeca, Campo, Secao } from "../componentes";
import { CampoImagem } from "../CampoImagem";

type Noticia = typeof noticias.$inferSelect;

export function NoticiasView({ lista }: { lista: Noticia[] }) {
  return (
    <>
      <Cabeca titulo="Notícias" descricao="O jornal da liga: uma imagem e um texto curto." />
      <p><a className="btn btn-ouro" href="/admin/noticias/nova">Escrever notícia</a></p>
      {lista.length === 0 ? (
        <p className="vazio">Nenhuma notícia publicada.</p>
      ) : (
        <div className="rolagem">
        <table className="tabela">
          <thead><tr><th /><th>Título</th><th>Data</th><th>Situação</th><th /></tr></thead>
          <tbody>
            {lista.map((n) => (
              <tr key={n.id}>
                <td style={{ width: 84 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {n.imagemUrl ? <img className="noticia-miniatura" src={n.imagemUrl} alt="" /> : <span className="noticia-miniatura" />}
                </td>
                <td><a href={`/admin/noticias/${n.id}`}>{n.titulo}</a></td>
                <td>{formatarData(n.publicadaEm)}</td>
                <td>{n.publicada ? <span className="selo selo-verde">Publicada</span> : <span className="selo selo-cinza">Rascunho</span>}</td>
                <td className="acoes">
                  <a className="btn btn-mini" href={`/admin/noticias/${n.id}`}>Editar</a>
                  <FormAcao acao={excluirNoticia} semMensagem perigo confirmar={`Excluir a notícia “${n.titulo}”? Não dá para desfazer.`}>
                    <input type="hidden" name="id" value={n.id} />
                    <Enviar variante="perigo" mini>Excluir</Enviar>
                  </FormAcao>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </>
  );
}

export function NoticiaView({ noticia }: { noticia: Noticia | null }) {
  return (
    <>
      <Cabeca titulo={noticia ? "Editar notícia" : "Nova notícia"} voltar={{ href: "/admin/noticias", rotulo: "Notícias" }} />
      <FormAcao acao={salvarNoticia}>
        {noticia && <input type="hidden" name="id" value={noticia.id} />}
        <div className="campos" style={{ maxWidth: 760 }}>
          <Campo rotulo="Título (curto, até uns 80 caracteres; evite tudo em MAIÚSCULAS, no jornal ele já aparece grande)" largo>
            <input type="text" name="titulo" required maxLength={120} defaultValue={noticia?.titulo} />
          </Campo>
          <Campo rotulo="Texto (linha em branco separa parágrafos; na capa aparece só o começo)" largo>
            <textarea name="texto" required defaultValue={noticia?.texto} style={{ minHeight: 180 }} />
          </Campo>
          <CampoImagem
            nome="imagem"
            rotulo="Imagem"
            dica="Tamanho ideal: 1600 × 900 px (formato 16:9, de tela de TV). PNG, JPG ou WEBP, até 3 MB. Outros formatos são cortados nas bordas, como na prévia."
            atual={noticia?.imagemUrl}
            proporcao="16 / 9"
          />
        </div>
        <div className="linha-form" style={{ marginBottom: 14 }}>
          <label className="marcar"><input type="checkbox" name="publicada" defaultChecked={noticia?.publicada ?? true} /> Publicada no site</label>
          {noticia?.imagemUrl && <label className="marcar"><input type="checkbox" name="removerImagem" /> Remover imagem</label>}
        </div>
        <Enviar>{noticia ? "Salvar notícia" : "Publicar notícia"}</Enviar>
      </FormAcao>
      {noticia && (
        <Secao titulo="Excluir">
          <FormAcao acao={excluirNoticia} perigo confirmar="Excluir esta notícia de vez? Não dá para desfazer.">
            <input type="hidden" name="id" value={noticia.id} />
            <Enviar variante="perigo">Excluir notícia</Enviar>
          </FormAcao>
        </Secao>
      )}
    </>
  );
}
