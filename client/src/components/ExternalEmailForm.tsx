import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail, Server, Trash2 } from 'lucide-react';

export function ExternalEmailForm() {
  const { data: credential, isLoading, error, refetch } = trpc.email.getExternalCredential.useQuery(undefined, {
    retry: 1,
    staleTime: 30000,
  });
  const saveCredential = trpc.email.saveExternalCredential.useMutation();
  const deleteCredential = trpc.email.deleteExternalCredential.useMutation();

  const [formData, setFormData] = useState({
    emailAddress: '',
    imapServer: '',
    imapPort: 993,
    imapUsername: '',
    imapPassword: '',
    smtpServer: '',
    smtpPort: 465,
    smtpUsername: '',
    smtpPassword: '',
  });

  // Update form when credential loads
  useEffect(() => {
    if (credential) {
      setFormData({
        emailAddress: credential.emailAddress,
        imapServer: credential.imapServer,
        imapPort: credential.imapPort,
        imapUsername: credential.imapUsername,
        imapPassword: credential.imapPassword,
        smtpServer: credential.smtpServer,
        smtpPort: credential.smtpPort,
        smtpUsername: credential.smtpUsername,
        smtpPassword: credential.smtpPassword,
      });
    }
  }, [credential]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveCredential.mutateAsync(formData);
      toast.success('External email account connected successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save email credentials');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to disconnect this email account?')) return;
    try {
      await deleteCredential.mutateAsync();
      toast.success('External email account disconnected');
      setFormData({
        emailAddress: '',
        imapServer: '',
        imapPort: 993,
        imapUsername: '',
        imapPassword: '',
        smtpServer: '',
        smtpPort: 465,
        smtpUsername: '',
        smtpPassword: '',
      });
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect email account');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Loading email settings...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            External Email Account
          </CardTitle>
          <CardDescription>
            Connect your Gmail, Outlook, or other email account via IMAP/SMTP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-4">
            Unable to load email settings. Please try refreshing the page.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          External Email Account
        </CardTitle>
        <CardDescription>
          Connect your Gmail, Outlook, or other email account via IMAP/SMTP
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Address */}
          <div className="space-y-2">
            <Label htmlFor="emailAddress">Email Address</Label>
            <Input
              id="emailAddress"
              type="email"
              value={formData.emailAddress}
              onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
              placeholder="your@email.com"
              required
            />
          </div>

          {/* IMAP Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <h3 className="font-semibold">IMAP Settings (Incoming Mail)</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imapServer">IMAP Server</Label>
                <Input
                  id="imapServer"
                  value={formData.imapServer}
                  onChange={(e) => setFormData({ ...formData, imapServer: e.target.value })}
                  placeholder="imap.gmail.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imapPort">IMAP Port</Label>
                <Input
                  id="imapPort"
                  type="number"
                  value={formData.imapPort}
                  onChange={(e) => setFormData({ ...formData, imapPort: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imapUsername">IMAP Username</Label>
              <Input
                id="imapUsername"
                value={formData.imapUsername}
                onChange={(e) => setFormData({ ...formData, imapUsername: e.target.value })}
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imapPassword">IMAP Password</Label>
              <Input
                id="imapPassword"
                type="password"
                value={formData.imapPassword}
                onChange={(e) => setFormData({ ...formData, imapPassword: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* SMTP Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <h3 className="font-semibold">SMTP Settings (Outgoing Mail)</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpServer">SMTP Server</Label>
                <Input
                  id="smtpServer"
                  value={formData.smtpServer}
                  onChange={(e) => setFormData({ ...formData, smtpServer: e.target.value })}
                  placeholder="smtp.gmail.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={formData.smtpPort}
                  onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpUsername">SMTP Username</Label>
              <Input
                id="smtpUsername"
                value={formData.smtpUsername}
                onChange={(e) => setFormData({ ...formData, smtpUsername: e.target.value })}
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">SMTP Password</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={formData.smtpPassword}
                onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              type="submit" 
              disabled={saveCredential.isPending}
              className="flex-1"
            >
              {saveCredential.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {credential ? 'Update Connection' : 'Connect Account'}
            </Button>
            {credential && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteCredential.isPending}
              >
                {deleteCredential.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Gmail:</strong> Use "App Password" instead of your regular password</p>
            <p><strong>Outlook:</strong> IMAP: outlook.office365.com:993, SMTP: smtp.office365.com:587</p>
            <p><strong>Yahoo:</strong> IMAP: imap.mail.yahoo.com:993, SMTP: smtp.mail.yahoo.com:465</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
