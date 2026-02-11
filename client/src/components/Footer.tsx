import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">TMP Server</h3>
            <p className="text-sm text-muted-foreground">
              Your all-in-one cloud platform for storage, email, games, and more.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms">
                  <a className="text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <a className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <p className="text-sm text-muted-foreground mb-2">Need help? Contact us:</p>
            <a
              href="mailto:support@tmpcollectables.com"
              className="text-sm text-primary hover:underline"
            >
              support@tmpcollectables.com
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TMP Server. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
