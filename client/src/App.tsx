import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import CloudStorage from "./pages/CloudStorage";
import VideoDownloader from "./pages/VideoDownloader";
import LinkUploader from "./pages/LinkUploader";
import Games from "./pages/Games";
import GamePlay from "./pages/GamePlay";
import Email from "./pages/Email";
import AIChat from "./pages/AIChat";
import CLI from "./pages/CLI";
import Settings from "./pages/Settings";
import Subscription from "./pages/Subscription";
import Backups from "./pages/Backups";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import BuyCredits from "./pages/BuyCredits";
import ManageSubscription from "./pages/ManageSubscription";
import VPN from "./pages/VPN";
import AdBlocker from "./pages/AdBlocker";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Status from "./pages/Status";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/storage"} component={CloudStorage} />
      <Route path={"/video-downloader"} component={VideoDownloader} />
      <Route path={"/links"} component={LinkUploader} />
      <Route path={"/games"} component={Games} />
      <Route path={"/games/:gameName"} component={GamePlay} />
      <Route path={"/email"} component={Email} />
      <Route path={"/ai-chat"} component={AIChat} />
      <Route path={"/cli"} component={CLI} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/subscription"} component={Subscription} />
      <Route path={"/backups"} component={Backups} />
      <Route path={"/buy-credits"} component={BuyCredits} />
      <Route path={"/manage-subscription"} component={ManageSubscription} />
      <Route path={"/vpn"} component={VPN} />
      <Route path={"/adblocker"} component={AdBlocker} />
      <Route path={"/checkout-success"} component={CheckoutSuccess} />
      <Route path={"/terms"} component={TermsOfService} />
      <Route path={"/privacy"} component={PrivacyPolicy} />
      <Route path={"/status"} component={Status} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
