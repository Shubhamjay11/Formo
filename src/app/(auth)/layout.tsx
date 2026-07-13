import { brand } from "@/config/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-6 text-center">
        <p className="text-2xl font-semibold tracking-tight text-foreground">{brand.name}</p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
