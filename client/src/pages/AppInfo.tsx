import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Apple, Download, Smartphone } from "lucide-react";

export default function AppInfo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Get TMP Server on Your Device
          </h1>
          <p className="text-xl text-blue-200">
            Access your cloud storage, games, and AI tools anywhere
          </p>
        </div>

        {/* App Store Buttons */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="p-8 bg-white/10 backdrop-blur-lg border-white/20">
            <div className="flex flex-col items-center text-center">
              <Apple className="w-16 h-16 text-white mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">iOS App</h2>
              <p className="text-blue-200 mb-6">
                Download from the App Store for iPhone and iPad
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Apple className="mr-2 h-5 w-5" />
                Download on App Store
              </Button>
              <p className="text-sm text-blue-300 mt-4">
                Coming Soon - Currently in Review
              </p>
            </div>
          </Card>

          <Card className="p-8 bg-white/10 backdrop-blur-lg border-white/20">
            <div className="flex-col items-center text-center">
              <Smartphone className="w-16 h-16 text-white mb-4 mx-auto" />
              <h2 className="text-2xl font-bold text-white mb-2">Android App</h2>
              <p className="text-blue-200 mb-6">
                Download from Google Play Store for Android devices
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Download className="mr-2 h-5 w-5" />
                Get it on Google Play
              </Button>
              <p className="text-sm text-blue-300 mt-4">
                Coming Soon - Currently in Review
              </p>
            </div>
          </Card>
        </div>

        {/* PWA Installation Instructions */}
        <Card className="p-8 bg-white/10 backdrop-blur-lg border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Install as Web App (Available Now!)
          </h2>
          
          <div className="space-y-6">
            {/* iOS Safari */}
            <div>
              <h3 className="text-xl font-semibold text-blue-300 mb-3">
                📱 iPhone/iPad (Safari)
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-100">
                <li>Open this website in Safari browser</li>
                <li>Tap the Share button (square with arrow pointing up)</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" in the top right corner</li>
                <li>The app icon will appear on your home screen</li>
              </ol>
            </div>

            {/* Android Chrome */}
            <div>
              <h3 className="text-xl font-semibold text-green-300 mb-3">
                📱 Android (Chrome)
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-100">
                <li>Open this website in Chrome browser</li>
                <li>Tap the three dots menu (⋮) in the top right</li>
                <li>Tap "Add to Home screen" or "Install app"</li>
                <li>Tap "Add" or "Install"</li>
                <li>The app will be added to your home screen</li>
              </ol>
            </div>

            {/* Desktop */}
            <div>
              <h3 className="text-xl font-semibold text-purple-300 mb-3">
                💻 Desktop (Chrome/Edge)
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-100">
                <li>Open this website in Chrome or Edge</li>
                <li>Click the install icon (⊕) in the address bar</li>
                <li>Click "Install" in the popup</li>
                <li>The app will open in its own window</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* Features */}
        <Card className="p-8 bg-white/10 backdrop-blur-lg border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Why Install the App?
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-blue-100">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="font-semibold text-white">Faster Access</h4>
                <p className="text-sm">Launch instantly from your home screen</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📴</span>
              <div>
                <h4 className="font-semibold text-white">Offline Support</h4>
                <p className="text-sm">Access cached content without internet</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔔</span>
              <div>
                <h4 className="font-semibold text-white">Push Notifications</h4>
                <p className="text-sm">Get updates for challenges and rewards</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎮</span>
              <div>
                <h4 className="font-semibold text-white">Full Features</h4>
                <p className="text-sm">Games, AI chat, storage, and more</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
