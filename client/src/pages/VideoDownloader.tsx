import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function VideoDownloader() {
  const [url, setUrl] = useState("");
  const utils = trpc.useUtils();

  const { data: downloads } = trpc.videoDownload.getDownloads.useQuery();

  const startDownloadMutation = trpc.videoDownload.startDownload.useMutation({
    onSuccess: () => {
      toast.success("Download started!");
      utils.videoDownload.getDownloads.invalidate();
      setUrl("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDownload = () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }
    startDownloadMutation.mutate({ url });
  };

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
              <h1 className="text-2xl font-bold">Video Downloader</h1>
              <p className="text-sm text-muted-foreground">Download videos from URLs</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Download Video</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter video URL (YouTube, Vimeo, etc.)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button onClick={handleDownload} disabled={startDownloadMutation.isPending} className="w-full">
              {startDownloadMutation.isPending ? "Starting..." : "Start Download"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Download History</CardTitle>
          </CardHeader>
          <CardContent>
            {downloads && downloads.length > 0 ? (
              <div className="space-y-2">
                {downloads.map((download) => (
                  <div key={download.id} className="p-3 rounded border border-border">
                    <p className="font-medium truncate">{download.title || download.url}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground capitalize">{download.status}</span>
                      {download.status === "completed" && download.fileUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={download.fileUrl} target="_blank" rel="noopener noreferrer">
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No downloads yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
