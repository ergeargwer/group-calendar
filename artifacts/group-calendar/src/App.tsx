import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";
import { getIdentity } from "./lib/identity";
import type { User } from "./lib/types";
import { SetupScreen } from "./components/SetupScreen";
import { CalendarView } from "./components/CalendarView";
import {
  getGetAvailabilityQueryKey,
  getGetAvailabilitySummaryQueryKey,
  hydrateCalendar,
  pollRemote,
  resolveUser,
} from "./lib/api";

const queryClient = new QueryClient();

function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const queryClientFromHook = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await hydrateCalendar();
      if (cancelled) return;
      const user = resolveUser(getIdentity());
      if (user) setCurrentUser(user);
      setIsInitializing(false);
    })();

    const interval = window.setInterval(() => {
      void (async () => {
        const changed = await pollRemote();
        if (changed) {
          queryClientFromHook.invalidateQueries({ queryKey: getGetAvailabilityQueryKey() });
          queryClientFromHook.invalidateQueries({ queryKey: getGetAvailabilitySummaryQueryKey() });
        }
      })();
    }, 12_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [queryClientFromHook]);

  if (isInitializing) {
    return <div className="min-h-screen bg-background flex items-center justify-center" />;
  }

  if (!currentUser) {
    return <SetupScreen onComplete={() => setCurrentUser(resolveUser(getIdentity()))} />;
  }

  return <CalendarView currentUser={currentUser} onLogout={() => setCurrentUser(null)} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
