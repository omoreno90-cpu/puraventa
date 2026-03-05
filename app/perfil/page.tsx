import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

export default async function PerfilPage() {
  const { userId } = await auth();

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Perfil</h1>
        <UserButton afterSignOutUrl="/perfil" />
      </div>

      <p style={{ marginTop: 12 }}>Estás logueado ✅</p>
      <p style={{ opacity: 0.7 }}>userId: {userId}</p>
    </div>
  );
}