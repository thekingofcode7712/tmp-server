import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Cloud, Mail, Gamepad2, Shield, Zap, Lock, 
  CheckCircle2, Server, Database, Cpu 
} from "lucide-react";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding & Features */}
        <div className="text-white space-y-8 hidden lg:block">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Server className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  TMP Server
                </h1>
                <p className="text-slate-400 text-lg">Your Complete Cloud Platform</p>
              </div>
            </div>
            <p className="text-xl text-slate-300 leading-relaxed">
              Experience the ultimate cloud ecosystem with unlimited storage, professional email, 
              premium games, AI assistance, and enterprise-grade security.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <Cloud className="h-8 w-8 text-blue-400 mb-2" />
              <h3 className="font-semibold mb-1">Cloud Storage</h3>
              <p className="text-sm text-slate-400">Unlimited file storage with no restrictions</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <Mail className="h-8 w-8 text-cyan-400 mb-2" />
              <h3 className="font-semibold mb-1">Email System</h3>
              <p className="text-sm text-slate-400">Gmail-like interface with 15GB free</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <Gamepad2 className="h-8 w-8 text-purple-400 mb-2" />
              <h3 className="font-semibold mb-1">20+ Games</h3>
              <p className="text-sm text-slate-400">Full library with leaderboards</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <Shield className="h-8 w-8 text-green-400 mb-2" />
              <h3 className="font-semibold mb-1">Enterprise Security</h3>
              <p className="text-sm text-slate-400">2FA, encryption, and VPN included</p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span>99.9% Uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-400" />
              <span>AES-256 Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span>Lightning Fast</span>
            </div>
          </div>
        </div>

        {/* Right side - Login Card */}
        <Card className="w-full max-w-md mx-auto bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl">
          <CardHeader className="text-center space-y-2 pb-6">
            <div className="mx-auto p-3 bg-blue-600 rounded-xl w-fit mb-2 lg:hidden">
              <Server className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-white lg:hidden">
              TMP Server
            </CardTitle>
            <CardTitle className="text-2xl font-bold text-white hidden lg:block">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-slate-400 text-base">
              Sign in to access your cloud platform
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Mobile feature highlights */}
            <div className="lg:hidden grid grid-cols-2 gap-3 pb-4">
              <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                <Cloud className="h-6 w-6 text-blue-400 mx-auto mb-1" />
                <p className="text-xs text-slate-300">Cloud Storage</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                <Mail className="h-6 w-6 text-cyan-400 mx-auto mb-1" />
                <p className="text-xs text-slate-300">Email System</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                <Gamepad2 className="h-6 w-6 text-purple-400 mx-auto mb-1" />
                <p className="text-xs text-slate-300">20+ Games</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                <Shield className="h-6 w-6 text-green-400 mx-auto mb-1" />
                <p className="text-xs text-slate-300">Secure VPN</p>
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                asChild 
                size="lg" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base h-12 shadow-lg shadow-blue-600/20"
              >
                <a href={getLoginUrl()}>
                  <Zap className="h-5 w-5 mr-2" />
                  Sign In with Manus OAuth
                </a>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500">Secure Authentication</span>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-slate-400">
                  Supports Google, GitHub, and more OAuth providers
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    <span>Encrypted</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    <span>Private</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Features list */}
            <div className="pt-4 border-t border-slate-700">
              <p className="text-sm font-semibold text-slate-300 mb-3">What you get:</p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span>5GB free cloud storage (upgradable to unlimited)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span>15GB free email storage with Gmail-like interface</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span>Access to 20 fully functional games</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span>AI chatbot with 100 free credits</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span>CLI with 200+ commands</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
