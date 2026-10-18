import Invitation from "@/components/Invitation";
import { getInvitation } from "@/lib/services/public";
export const dynamic = "force-dynamic";
export default async function Home() {
  const data = await getInvitation();
  if (!data)
    return (
      <main className="empty-page">
        <p className="kicker">Ale & Juan</p>
        <h1>Estamos preparando algo especial</h1>
        <p>Muy pronto podrás ver nuestra invitación.</p>
        <a href="/admin">Administrar invitación</a>
      </main>
    );
  return <Invitation config={data.config} assets={data.assets} />;
}
