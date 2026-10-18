import Invitation from "@/components/Invitation";
import { getInvitation } from "@/lib/services/public";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Tu invitación · Ale & Juan",
  robots: { index: false, follow: false },
};
export default async function Personalized({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getInvitation(token);
  if (!data) notFound();
  return (
    <Invitation
      config={data.config}
      assets={data.assets}
      guests={data.guests}
      groupName={data.group?.display_name}
      token={token}
    />
  );
}
