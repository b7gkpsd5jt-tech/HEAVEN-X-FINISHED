import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LangProvider } from "@/contexts/LangContext";
import Navbar from "@/components/Navbar";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Library from "@/pages/Library";
import Login from "@/pages/Login";
import SeriesDetail from "@/pages/SeriesDetail";
import Reader from "@/pages/Reader";
import Favorites from "@/pages/Favorites";
import AdminLayout from "@/pages/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import ManageSeries from "@/pages/admin/ManageSeries";
import ManageChapters from "@/pages/admin/ManageChapters";
import ManageUsers from "@/pages/admin/ManageUsers";
import ManageComments from "@/pages/admin/ManageComments";
import ManageSocialLinks from "@/pages/admin/ManageSocialLinks";
import ManagePopups from "@/pages/admin/ManagePopups";
import ManageBanners from "@/pages/admin/ManageBanners";
import SystemSettings from "@/pages/admin/SystemSettings";
import Analytics from "@/pages/admin/Analytics";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AdminRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={Dashboard} />
        <Route path="/admin/series" component={ManageSeries} />
        <Route path="/admin/chapters" component={ManageChapters} />
        <Route path="/admin/users" component={ManageUsers} />
        <Route path="/admin/comments" component={ManageComments} />
        <Route path="/admin/social-links" component={ManageSocialLinks} />
        <Route path="/admin/popups" component={ManagePopups} />
        <Route path="/admin/banners" component={ManageBanners} />
        <Route path="/admin/settings" component={SystemSettings} />
        <Route path="/admin/analytics" component={Analytics} />
        <Route component={Dashboard} />
      </Switch>
    </AdminLayout>
  );
}

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <>
      <Navbar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/library" component={Library} />
        <Route path="/series/:id" component={SeriesDetail} />
        <Route path="/favorites" component={Favorites} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  return (
    <Switch>
      {/* Login — always accessible, redirect to home if already logged in */}
      <Route path="/login">
        {() => {
          if (!loading && user) return <Redirect to="/" />;
          return <Login />;
        }}
      </Route>

      {/* Admin routes — no Navbar */}
      <Route path="/admin" component={AdminRoutes} />
      <Route path="/admin/:rest*" component={AdminRoutes} />

      {/* Reader — no Navbar, auth checked inside */}
      <Route path="/reader/:id" component={Reader} />

      {/* All other routes require auth */}
      <Route component={ProtectedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <LangProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppRoutes />
            </WouterRouter>
            <Toaster />
          </LangProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
