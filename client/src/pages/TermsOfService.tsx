import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
            <h1 className="text-2xl font-bold">Terms of Service</h1>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>TMP Server Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: February 11, 2026</p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using TMP Server ("the Service"), you accept and agree to be bound by the terms and
              provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              TMP Server provides cloud storage, email services, games, video downloading, AI chatbot, CLI terminal,
              VPN service, ad blocking, and other features ("Services"). The Service is provided "as is" and we reserve
              the right to modify, suspend, or discontinue any aspect of the Service at any time.
            </p>

            <h2>3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities
              that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>

            <h2>4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>Upload, store, or share illegal, harmful, or offensive content</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon intellectual property rights of others</li>
              <li>Distribute malware, viruses, or harmful code</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the Service for any commercial purpose without authorization</li>
            </ul>

            <h2>5. Storage and Content</h2>
            <p>
              You retain all rights to content you upload to TMP Server. However, by uploading content, you grant us
              the right to store, process, and display your content as necessary to provide the Service. We are not
              responsible for any loss or corruption of your content.
            </p>

            <h2>6. Subscription and Payments</h2>
            <p>
              Paid subscriptions are billed in advance on a monthly basis. You can cancel your subscription at any time,
              but no refunds will be provided for partial months. Storage limits and features vary by subscription tier.
            </p>

            <h2>7. Termination</h2>
            <p>
              We reserve the right to terminate or suspend your account at any time for violations of these Terms of
              Service. Upon termination, your right to use the Service will immediately cease, and we may delete your
              data.
            </p>

            <h2>8. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT
              WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>

            <h2>9. Limitation of Liability</h2>
            <p>
              IN NO EVENT SHALL TMP SERVER BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
              DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
            </p>

            <h2>10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms of Service at any time. We will notify users of any material
              changes. Your continued use of the Service after such modifications constitutes acceptance of the updated
              terms.
            </p>

            <h2>11. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at:{" "}
              <a href="mailto:support@tmpcollectables.com" className="text-primary hover:underline">
                support@tmpcollectables.com
              </a>
            </p>

            <h2>12. Governing Law</h2>
            <p>
              These Terms of Service shall be governed by and construed in accordance with applicable laws, without
              regard to conflict of law principles.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
