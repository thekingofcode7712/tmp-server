/**
 * Install as App Guide
 * Instructions for installing TMP Server as a Progressive Web App (PWA)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function InstallAsApp() {
  const [selectedBrowser, setSelectedBrowser] = useState<'chrome' | 'firefox' | 'safari' | 'edge'>('chrome');

  const instructions = {
    chrome: {
      name: 'Google Chrome / Chromium',
      steps: [
        'Open TMP Server in Google Chrome or any Chromium-based browser',
        'Look for the install icon in the address bar (looks like a computer with a plus sign)',
        'Click the install icon and select "Install app"',
        'Choose where to install (default is your applications folder)',
        'The app will open in its own window without browser tabs',
        'You can now use TMP Server like a native desktop application',
      ],
      icon: '🔵',
    },
    firefox: {
      name: 'Mozilla Firefox',
      steps: [
        'Open TMP Server in Mozilla Firefox',
        'Click the menu button (three horizontal lines) in the top right',
        'Select "Applications" from the menu',
        'Find TMP Server in the list and click the install button',
        'Choose your preferred installation location',
        'Firefox will create a desktop shortcut and app launcher',
        'Launch the app from your applications menu or desktop',
      ],
      icon: '🦊',
    },
    safari: {
      name: 'Apple Safari (macOS / iOS)',
      steps: [
        'Open TMP Server in Safari',
        'Click the Share button (arrow pointing out of a box)',
        'Select "Add to Home Screen" or "Add to Dock"',
        'Enter a name for the app (or use the default)',
        'Choose where to save (Home Screen or Dock)',
        'The app will appear as an icon on your home screen or dock',
        'Tap or click the icon to launch TMP Server',
      ],
      icon: '🍎',
    },
    edge: {
      name: 'Microsoft Edge',
      steps: [
        'Open TMP Server in Microsoft Edge',
        'Click the install icon in the address bar (looks like a computer with a plus sign)',
        'Select "Install this site as an app"',
        'Confirm the app name and click "Install"',
        'Edge will create a desktop shortcut and start menu entry',
        'The app launches in its own window without browser UI',
        'You can now access TMP Server as a standalone application',
      ],
      icon: '🔵',
    },
  };

  const currentInstructions = instructions[selectedBrowser];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Install TMP Server as an App</h1>
          <p className="text-muted-foreground">
            Transform TMP Server into a native-like application on your device. No installation required—just a few clicks!
          </p>
        </div>

        {/* Benefits */}
        <Card className="p-6 bg-card border-border mb-8">
          <h2 className="text-2xl font-semibold text-card-foreground mb-4">Why Install as an App?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="font-semibold text-card-foreground">Faster Access</p>
                <p className="text-sm text-muted-foreground">Launch from your desktop or home screen instantly</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-semibold text-card-foreground">Dedicated Window</p>
                <p className="text-sm text-muted-foreground">Runs in its own window without browser tabs</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <p className="font-semibold text-card-foreground">Works Offline</p>
                <p className="text-sm text-muted-foreground">Access cached content even without internet</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">🔔</span>
              <div>
                <p className="font-semibold text-card-foreground">Notifications</p>
                <p className="text-sm text-muted-foreground">Receive push notifications for important updates</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Browser Selection */}
        <Card className="p-6 bg-card border-border mb-8">
          <h2 className="text-2xl font-semibold text-card-foreground mb-4">Choose Your Browser</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {(Object.keys(instructions) as Array<keyof typeof instructions>).map((browser) => (
              <Button
                key={browser}
                onClick={() => setSelectedBrowser(browser)}
                variant={selectedBrowser === browser ? 'default' : 'outline'}
                className="flex flex-col items-center gap-2 py-6"
              >
                <span className="text-2xl">{instructions[browser].icon}</span>
                <span className="text-xs text-center">{instructions[browser].name.split(' ')[0]}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-6 bg-card border-border mb-8">
          <h2 className="text-2xl font-semibold text-card-foreground mb-6">
            {currentInstructions.icon} {currentInstructions.name}
          </h2>
          <ol className="space-y-4">
            {currentInstructions.steps.map((step, idx) => (
              <li key={idx} className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                  {idx + 1}
                </div>
                <p className="text-card-foreground pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </Card>

        {/* Troubleshooting */}
        <Card className="p-6 bg-card border-border">
          <h2 className="text-2xl font-semibold text-card-foreground mb-4">Troubleshooting</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">I don't see the install button</h3>
              <p className="text-sm text-muted-foreground">
                Make sure you're using a modern browser that supports PWA installation (Chrome 76+, Edge 79+, Firefox 58+, Safari 15.1+). Try refreshing the page and looking in the address bar or menu.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">The app won't launch</h3>
              <p className="text-sm text-muted-foreground">
                Try uninstalling and reinstalling the app. If the issue persists, clear your browser cache and cookies, then reinstall.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">I want to uninstall the app</h3>
              <p className="text-sm text-muted-foreground">
                On desktop: Right-click the app icon and select "Uninstall". On mobile: Long-press the app icon and select "Remove" or "Uninstall".
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">The app isn't updating</h3>
              <p className="text-sm text-muted-foreground">
                PWA updates happen in the background. Try closing and reopening the app, or wait a few minutes for the update to download automatically.
              </p>
            </div>
          </div>
        </Card>

        {/* Features Available */}
        <Card className="p-6 bg-card border-border mt-8">
          <h2 className="text-2xl font-semibold text-card-foreground mb-4">Features Available in App Mode</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <p className="text-card-foreground">Cloud Storage Management</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <p className="text-card-foreground">Custom UI Themes</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <p className="text-card-foreground">Email Storage</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <p className="text-card-foreground">Theme Selector</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <p className="text-card-foreground">Analytics Dashboard</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <p className="text-card-foreground">Offline Access (Cached)</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default InstallAsApp;
