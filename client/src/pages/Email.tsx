import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";
import { ArrowLeft, Mail, Send, Trash2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Email() {
  const [composing, setComposing] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const utils = trpc.useUtils();

  const { data: account } = trpc.email.getAccount.useQuery();
  const { data: inbox } = trpc.email.getEmails.useQuery({ folder: "inbox" });
  const { data: sent } = trpc.email.getEmails.useQuery({ folder: "sent" });

  const sendEmailMutation = trpc.email.sendEmail.useMutation({
    onSuccess: () => {
      toast.success("Email sent!");
      utils.email.getEmails.invalidate();
      setComposing(false);
      setTo("");
      setSubject("");
      setBody("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteEmailMutation = trpc.email.deleteEmail.useMutation({
    onSuccess: () => {
      toast.success("Email deleted");
      utils.email.getEmails.invalidate();
    },
  });

  const checkNewEmailsMutation = trpc.email.checkNewEmails.useMutation({
    onSuccess: (data) => {
      if (data.newEmails > 0) {
        toast.success(`Received ${data.newEmails} new email(s)!`);
      } else {
        toast.info("No new emails");
      }
      utils.email.getEmails.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to check emails");
    },
  });

  const handleSend = () => {
    if (!to || !subject) {
      toast.error("Please fill in all fields");
      return;
    }
    sendEmailMutation.mutate({ to, subject, body });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Email</h1>
                <p className="text-sm text-muted-foreground">{account?.emailAddress}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => checkNewEmailsMutation.mutate()}
                disabled={checkNewEmailsMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${checkNewEmailsMutation.isPending ? 'animate-spin' : ''}`} />
                Check New Emails
              </Button>
              <Dialog open={composing} onOpenChange={setComposing}>
                <DialogTrigger asChild>
                  <Button>
                    <Mail className="h-4 w-4 mr-2" />
                    Compose
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>New Email</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="To"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                  <Input
                    placeholder="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                  <Textarea
                    placeholder="Message"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={10}
                    className="email-editor"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setComposing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSend} disabled={sendEmailMutation.isPending}>
                      <Send className="h-4 w-4 mr-2" />
                      {sendEmailMutation.isPending ? "Sending..." : "Send"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-6xl">
        <Tabs defaultValue="inbox">
          <TabsList>
            <TabsTrigger value="inbox">Inbox ({inbox?.length || 0})</TabsTrigger>
            <TabsTrigger value="sent">Sent ({sent?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="inbox">
            <Card>
              <CardContent className="pt-6">
                {inbox && inbox.length > 0 ? (
                  <div className="space-y-2">
                    {inbox.map((email) => (
                      <div
                        key={email.id}
                        className={`p-4 rounded border border-border ${!email.isRead ? "bg-muted" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{email.fromAddress}</span>
                              {!email.isRead && (
                                <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="font-medium mb-1">{email.subject}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{email.body}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(email.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteEmailMutation.mutate({ emailId: email.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No emails in inbox</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent">
            <Card>
              <CardContent className="pt-6">
                {sent && sent.length > 0 ? (
                  <div className="space-y-2">
                    {sent.map((email) => (
                      <div key={email.id} className="p-4 rounded border border-border">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-muted-foreground">To:</span>
                              <span className="font-semibold">{email.toAddress}</span>
                            </div>
                            <p className="font-medium mb-1">{email.subject}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{email.body}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(email.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteEmailMutation.mutate({ emailId: email.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No sent emails</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
