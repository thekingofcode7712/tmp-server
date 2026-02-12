import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Download, Lock, Eye } from "lucide-react";
import { useState } from "react";
import { useRoute } from "wouter";
import { toast } from "sonner";

export default function SharedFile() {
  const [, params] = useRoute("/share/:token");
  const shareToken = params?.token || "";
  const [password, setPassword] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const { data: shareInfo, isLoading, error } = trpc.storage.getShareLink.useQuery(
    { shareToken },
    { enabled: !!shareToken, retry: false }
  );

  const downloadMutation = trpc.storage.downloadSharedFile.useMutation({
    onSuccess: (data) => {
      window.open(data.fileUrl, '_blank');
      toast.success("Download started!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDownload = () => {
    downloadMutation.mutate({
      shareToken,
      password: password || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !shareInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Share Link Not Found</CardTitle>
            <CardDescription>
              This share link may have expired or been deleted.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {shareInfo.fileName}
          </CardTitle>
          <CardDescription>
            {(shareInfo.fileSize / 1024).toFixed(2)} KB • {shareInfo.accessCount} downloads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {shareInfo.requiresPassword && (
            <div className="space-y-2">
              <Label htmlFor="password">
                <Lock className="h-4 w-4 inline mr-2" />
                This file is password protected
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-2">
            {shareInfo.mimeType?.startsWith('image/') && (
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide Preview' : 'Preview'}
              </Button>
            )}
            <Button
              onClick={handleDownload}
              disabled={downloadMutation.isPending}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloadMutation.isPending ? "Downloading..." : "Download"}
            </Button>
          </div>

          {showPreview && shareInfo.mimeType?.startsWith('image/') && (
            <div className="mt-4 border rounded-lg overflow-hidden">
              <img
                src={`/api/shared-preview/${shareToken}`}
                alt={shareInfo.fileName}
                className="w-full h-auto"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
