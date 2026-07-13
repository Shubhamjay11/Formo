import Link from "next/link";
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
        <div className="flex items-center gap-4">
          <p className="text-sm font-semibold tracking-tight text-foreground">
            {brand.name}
          </p>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/settings/members"
              className="text-muted-foreground hover:text-foreground"
            >
              Members
            </Link>
          </nav>
        </div>
        <LogoutButton />
      </header>
      <main>{children}</main>
    </div>
  );
}
