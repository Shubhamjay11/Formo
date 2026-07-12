import { redirect } from "next/navigation";
import { brand } from "@/config/brand";
import { LogoutButton } from "@/modules/auth/components/logout-button";
import { getSession } from "@/server/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!session.user.emailVerified) {
    redirect("/verify-email");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <p className="text-sm font-semibold tracking-tight text-foreground">
          {brand.name}
        </p>
        <LogoutButton />
      </header>
      <main>{children}</main>
    </div>
  );
}
