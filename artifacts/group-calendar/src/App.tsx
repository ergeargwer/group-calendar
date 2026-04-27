import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";
import { getIdentity, User } from "./lib/identity";
import { SetupScreen } from "./components/SetupScreen";
import { CalendarView } from "./components/CalendarView";

const queryClient = new QueryClient();

function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const user = getIdentity();
    if (user) setCurrentUser(user);
    setIsInitializing(false);
  }, []);

  if (isInitializing) {
    return <div className="min-h-screen bg-background flex items-center justify-center" />;
  }

  if (!currentUser) {
    return <SetupScreen onComplete={() => setCurrentUser(getIdentity())} />;
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
