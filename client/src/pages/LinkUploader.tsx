import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function LinkUploader() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"music" | "video" | "app">("music");
  const utils = trpc.useUtils();

  const { data: links } = trpc.links.getLinks.useQuery({});

  const addLinkMutation = trpc.links.addLink.useMutation({
    onSuccess: () => {
      toast.success("Link added!");
      utils.links.getLinks.invalidate();
      setUrl("");
      setTitle("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteLinkMutation = trpc.links.deleteLink.useMutation({
    onSuccess: () => {
      toast.success("Link deleted");
      utils.links.getLinks.invalidate();
    },
  });

  const handleAddLink = () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }
    addLinkMutation.mutate({ url, type, title });
  };

  const musicLinks = links?.filter((l) => l.linkType === "music") || [];
  const videoLinks = links?.filter((l) => l.linkType === "video") || [];
  const appLinks = links?.filter((l) => l.linkType === "app") || [];

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
            <div>
              <h1 className="text-2xl font-bold">Link Uploader</h1>
              <p className="text-sm text-muted-foreground">Save music, video, and app links</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="music">Music</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="app">App</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Enter URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Input
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Button onClick={handleAddLink} disabled={addLinkMutation.isPending} className="w-full">
              {addLinkMutation.isPending ? "Adding..." : "Add Link"}
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="music">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="music">Music ({musicLinks.length})</TabsTrigger>
            <TabsTrigger value="video">Video ({videoLinks.length})</TabsTrigger>
            <TabsTrigger value="app">App ({appLinks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="music">
            <Card>
              <CardContent className="pt-6">
                {musicLinks.length > 0 ? (
                  <div className="space-y-2">
                    {musicLinks.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-3 rounded border border-border">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{link.title || "Untitled"}</p>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">
                            {link.url}
                          </a>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteLinkMutation.mutate({ linkId: link.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No music links yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="video">
            <Card>
              <CardContent className="pt-6">
                {videoLinks.length > 0 ? (
                  <div className="space-y-2">
                    {videoLinks.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-3 rounded border border-border">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{link.title || "Untitled"}</p>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">
                            {link.url}
                          </a>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteLinkMutation.mutate({ linkId: link.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No video links yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="app">
            <Card>
              <CardContent className="pt-6">
                {appLinks.length > 0 ? (
                  <div className="space-y-2">
                    {appLinks.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-3 rounded border border-border">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{link.title || "Untitled"}</p>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">
                            {link.url}
                          </a>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteLinkMutation.mutate({ linkId: link.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No app links yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
