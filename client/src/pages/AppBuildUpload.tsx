import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Smartphone, Apple, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

export default function AppBuildUpload() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [platform, setPlatform] = useState<"ios" | "android">("ios");
  const [version, setVersion] = useState("");
  const [buildNumber, setBuildNumber] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadBuild = trpc.appBuilds.uploadBuild.useMutation({
    onSuccess: (data) => {
      toast.success(`Build uploaded successfully!`, {
        description: `${platform === 'ios' ? 'iOS' : 'Android'} build v${version} is now available for download.`,
      });
      // Reset form
      setVersion("");
      setBuildNumber("");
      setReleaseNotes("");
      setSelectedFile(null);
      setUploading(false);
      setLocation("/app-builds");
    },
    onError: (error) => {
      toast.error("Upload failed", {
        description: error.message,
      });
      setUploading(false);
    },
  });

  // Only allow owner (user ID 1) to access
  if (!user || user.id !== 1) {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only the app owner can upload builds.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file extension
      const expectedExt = platform === 'ios' ? '.ipa' : '.aab';
      if (!file.name.endsWith(expectedExt)) {
        toast.error("Invalid file type", {
          description: `Please select a ${expectedExt} file for ${platform === 'ios' ? 'iOS' : 'Android'}.`,
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !version || !buildNumber) {
      toast.error("Missing information", {
        description: "Please fill in all required fields and select a file.",
      });
      return;
    }

    setUploading(true);

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const base64Data = base64.split(',')[1]; // Remove data:*/*;base64, prefix

      await uploadBuild.mutateAsync({
        platform,
        version,
        buildNumber: parseInt(buildNumber),
        fileName: selectedFile.name,
        fileData: base64Data,
        releaseNotes: releaseNotes || undefined,
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload App Build</h1>
        <p className="text-muted-foreground">
          Upload iOS (.ipa) or Android (.aab) builds for TMP Server mobile app
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Build Information</CardTitle>
          <CardDescription>
            Provide details about the app build you're uploading
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select value={platform} onValueChange={(val) => setPlatform(val as "ios" | "android")}>
              <SelectTrigger id="platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ios">
                  <div className="flex items-center gap-2">
                    <Apple className="h-4 w-4" />
                    iOS (.ipa)
                  </div>
                </SelectItem>
                <SelectItem value="android">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Android (.aab)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Version */}
          <div className="space-y-2">
            <Label htmlFor="version">Version *</Label>
            <Input
              id="version"
              placeholder="e.g., 1.0.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>

          {/* Build Number */}
          <div className="space-y-2">
            <Label htmlFor="buildNumber">Build Number *</Label>
            <Input
              id="buildNumber"
              type="number"
              placeholder="e.g., 1"
              value={buildNumber}
              onChange={(e) => setBuildNumber(e.target.value)}
            />
          </div>

          {/* Release Notes */}
          <div className="space-y-2">
            <Label htmlFor="releaseNotes">Release Notes (Optional)</Label>
            <Textarea
              id="releaseNotes"
              placeholder="What's new in this version..."
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Build File *</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file"
                type="file"
                accept={platform === 'ios' ? '.ipa' : '.aab'}
                onChange={handleFileSelect}
                disabled={uploading}
              />
              {selectedFile && (
                <div className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={uploading || !selectedFile || !version || !buildNumber}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Build
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
