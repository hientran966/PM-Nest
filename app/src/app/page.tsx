import AuthGuard from "@/components/guards/AuthGuard";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}