import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>TMP Server Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: February 11, 2026</p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <h2>1. Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, and authentication credentials</li>
              <li><strong>Usage Data:</strong> Information about how you use our Service, including features accessed and actions taken</li>
              <li><strong>Content Data:</strong> Files, emails, and other content you upload or create using the Service</li>
              <li><strong>Payment Information:</strong> Billing details processed securely through Stripe</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, and log data</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide, maintain, and improve the Service</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send service-related communications and updates</li>
              <li>Respond to your requests and provide customer support</li>
              <li>Analyze usage patterns to enhance user experience</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
            </ul>

            <h2>3. Data Storage and Security</h2>
            <p>
              Your data is stored securely using industry-standard encryption. We implement appropriate technical and
              organizational measures to protect your information against unauthorized access, alteration, disclosure,
              or destruction.
            </p>

            <h2>4. Data Sharing</h2>
            <p>We do not sell your personal information. We may share your data with:</p>
            <ul>
              <li><strong>Service Providers:</strong> Third-party vendors who assist in providing the Service (e.g., Stripe for payments, AWS for storage)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>

            <h2>5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your account and data</li>
              <li>Export your data in a portable format</li>
              <li>Opt-out of marketing communications</li>
              <li>Object to processing of your data</li>
            </ul>

            <h2>6. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to maintain your session, remember your preferences, and analyze
              Service usage. You can control cookie settings through your browser, but disabling cookies may affect
              Service functionality.
            </p>

            <h2>7. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide the Service.
              After account deletion, we may retain certain data for legal, security, or backup purposes for a limited
              period.
            </p>

            <h2>8. Children's Privacy</h2>
            <p>
              The Service is not intended for users under 13 years of age. We do not knowingly collect personal
              information from children. If we discover that a child has provided personal information, we will delete
              it immediately.
            </p>

            <h2>9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We ensure
              appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
            </p>

            <h2>10. Changes to Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by
              posting the new policy and updating the "Last updated" date. Your continued use of the Service after
              changes constitutes acceptance of the updated policy.
            </p>

            <h2>11. Third-Party Services</h2>
            <p>
              The Service may contain links to third-party websites or services. We are not responsible for the privacy
              practices of these third parties. We encourage you to review their privacy policies.
            </p>

            <h2>12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at:{" "}
              <a href="mailto:support@tmpcollectables.com" className="text-primary hover:underline">
                support@tmpcollectables.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
