import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";
import { ArrowLeft, Mail, Send, Trash2, RefreshCw, Search, Filter, Clock, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseEmailContent, formatEmailForDisplay } from "@/lib/emailParser";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Email() {
  const [composing, setComposing] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'read' | 'unread'>('all');
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

      <div className="container py-8">
        {/* Search and Filter Bar */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by sender, subject, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Emails</SelectItem>
              <SelectItem value="unread">Unread Only</SelectItem>
              <SelectItem value="read">Read Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Tabs defaultValue="inbox" className="w-full">
          <TabsList>
            <TabsTrigger value="inbox">Inbox ({inbox?.length || 0})</TabsTrigger>
            <TabsTrigger value="sent">Sent ({sent?.length || 0})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inbox">
            <Card>
              <CardContent className="pt-6">
                {inbox && inbox.length > 0 ? (
                  <div className="space-y-2">
                    {inbox
                      .filter((email) => {
                        // Apply read/unread filter
                        if (filterStatus === 'read' && !email.isRead) return false;
                        if (filterStatus === 'unread' && email.isRead) return false;
                        
                        // Apply search filter
                        if (searchQuery) {
                          const query = searchQuery.toLowerCase();
                          return (
                            email.fromAddress?.toLowerCase().includes(query) ||
                            email.subject?.toLowerCase().includes(query) ||
                            email.body?.toLowerCase().includes(query)
                          );
                        }
                        
                        return true;
                      })
                      .map((email) => (
                      <div
                        key={email.id}
                        className={`p-4 rounded border border-border cursor-pointer hover:bg-accent/50 transition-colors ${!email.isRead ? "bg-muted" : ""}`}
                        onClick={() => setSelectedEmail(email)}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEmailMutation.mutate({ emailId: email.id });
                            }}
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
                    {sent
                      .filter((email) => {
                        // Sent emails don't have read/unread status, so only apply search
                        if (searchQuery) {
                          const query = searchQuery.toLowerCase();
                          return (
                            email.toAddress?.toLowerCase().includes(query) ||
                            email.subject?.toLowerCase().includes(query) ||
                            email.body?.toLowerCase().includes(query)
                          );
                        }
                        
                        return true;
                      })
                      .map((email) => (
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
      
      {/* Email Detail Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedEmail && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEmail.subject}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="bg-card rounded-lg p-6 border border-border space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">From</p>
                    <p className="text-base font-semibold text-foreground">{selectedEmail.fromAddress}</p>
                  </div>
                  {selectedEmail.toAddress && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">To</p>
                      <p className="text-base font-semibold text-foreground">{selectedEmail.toAddress}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Date</p>
                    <p className="text-sm text-muted-foreground">{new Date(selectedEmail.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-background rounded-lg p-6 min-h-[300px]">
                  {(() => {
                    const { plainText } = parseEmailContent(selectedEmail.body);
                    const formatted = formatEmailForDisplay(plainText);
                    return (
                      <div className="text-base leading-relaxed text-foreground whitespace-pre-wrap break-words">
                        {formatted || 'No content'}
                      </div>
                    );
                  })()}
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTo(selectedEmail.fromAddress);
                      setSubject(`Re: ${selectedEmail.subject}`);
                      setBody(`\n\n---\nOn ${new Date(selectedEmail.createdAt).toLocaleString()}, ${selectedEmail.fromAddress} wrote:\n${selectedEmail.body}`);
                      setSelectedEmail(null);
                      setComposing(true);
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTo('');
                      setSubject(`Fwd: ${selectedEmail.subject}`);
                      setBody(`\n\n---\nForwarded message from ${selectedEmail.fromAddress}:\n${selectedEmail.body}`);
                      setSelectedEmail(null);
                      setComposing(true);
                    }}
                  >
                    Forward
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      deleteEmailMutation.mutate({ emailId: selectedEmail.id });
                      setSelectedEmail(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
