import Link from "next/link";
import catalog from "../../public/juan-ale/catalogo.json";
export default function ArtPage() {
  return <main style={{maxWidth:1100,margin:"auto",padding:"30px 20px",fontFamily:"Georgia,serif"}}>
    <Link href="/admin">← Volver al administrador</Link>
    <h1 style={{color:"#893F04"}}>Biblioteca Juan & Ale</h1>
    <p>Recursos incluidos en el proyecto. Para añadirlos a Supabase, abre /admin → Recursos y pulsa «Importar paquete Juan & Ale».</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:16}}>
    {catalog.map(a=><div key={a.url} style={{padding:12,background:"#F7F1E8",borderRadius:14}}>
      <img src={a.url} alt={a.description} style={{width:"100%",height:230,objectFit:"contain"}}/>
      <p>{a.description}</p><a href={a.url} download>Descargar imagen</a>
    </div>)}</div></main>;
}
