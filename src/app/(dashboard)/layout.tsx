import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full overflow-hidden p-0 md:p-2">
        <div className="min-h-screen w-full overflow-hidden bg-[#d5d5d3]/85 shadow-[0_30px_90px_rgba(0,0,0,0.12)] ring-1 ring-black/5 backdrop-blur md:min-h-[calc(100vh-1rem)] md:rounded-[2rem]">
          <div className="grid min-h-screen w-full md:min-h-[calc(100vh-1rem)] lg:grid-cols-[214px_minmax(0,1fr)]">
            <AppSidebar />

            <div className="min-w-0">
              <AppTopbar />

              <main className="w-full px-3 pb-5 lg:px-5">{children}</main>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
