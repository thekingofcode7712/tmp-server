import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, Upload, Trash2, Download, FolderOpen } from "lucide-react";
import { useState, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function CloudStorage() {
  const { isAuthenticated } = useAuth();
  const [selectedFolder, setSelectedFolder] = useState("/");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: files, isLoading } = trpc.storage.getFiles.useQuery(
    { folder: selectedFolder },
    { enabled: isAuthenticated }
  );

  const uploadMutation = trpc.storage.uploadFile.useMutation({
    onSuccess: () => {
      toast.success("File uploaded successfully");
      utils.storage.getFiles.invalidate();
      utils.dashboard.stats.invalidate();
      setIsUploading(false);
      setUploadProgress(0);
    },
    onError: (error) => {
      toast.error(error.message);
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const deleteMutation = trpc.storage.deleteFile.useMutation({
    onSuccess: () => {
      toast.success("File deleted");
      utils.storage.getFiles.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const shouldChunk = file.size > CHUNK_SIZE;
    
    if (shouldChunk) {
      // Chunked upload for large files
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const uploadId = Math.random().toString(36).substring(7);
      
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        
        const reader = new FileReader();
        await new Promise<void>((resolve, reject) => {
          reader.onload = async (event) => {
            try {
              const base64 = event.target?.result as string;
              const base64Data = base64.split(',')[1];
              
              await uploadMutation.mutateAsync({
                fileName: file.name,
                fileData: base64Data,
                mimeType: file.type,
                folder: selectedFolder,
                chunkIndex,
                totalChunks,
                uploadId,
              });
              
              const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
              setUploadProgress(progress);
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(chunk);
        });
      }
      
      setIsUploading(false);
      setUploadProgress(0);
    } else {
      // Single upload for small files
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 50);
          setUploadProgress(progress);
        }
      };
      
      reader.onload = async (event) => {
        setUploadProgress(60);
        const base64 = event.target?.result as string;
        const base64Data = base64.split(',')[1];

        setUploadProgress(80);
        uploadMutation.mutate({
          fileName: file.name,
          fileData: base64Data,
          mimeType: file.type,
          folder: selectedFolder,
        });
        setUploadProgress(100);
      };
      
      reader.readAsDataURL(file);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to access cloud storage</p>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold">Cloud Storage</h1>
              <p className="text-sm text-muted-foreground">Upload and manage your files</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {isUploading && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading file...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{selectedFolder}</span>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
              <Upload className="h-4 w-4 mr-2" />
              {uploadMutation.isPending ? "Uploading..." : "Upload File"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : files && files.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <Card key={file.id}>
                <CardHeader>
                  <CardTitle className="text-base truncate">{file.fileName}</CardTitle>
                  <CardDescription>
                    {((file.fileSize || 0) / 1024).toFixed(2)} KB
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate({ fileId: file.id })}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No files yet. Upload your first file!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
