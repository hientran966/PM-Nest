import AuthGuard from "../components/guards/AuthGuard";
import Dashboard from "./dashboard/page";

export default function Home() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}