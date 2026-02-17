import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, Upload, Trash2, Download, FolderOpen, ArrowUpDown, Eye, Share2, X, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { getMimeType } from "@/lib/mimeTypes";
import pako from 'pako';

// Format file size to human-readable format
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export default function CloudStorage() {
  const { isAuthenticated } = useAuth();
  const [selectedFolder, setSelectedFolder] = useState("/");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<Array<{
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error';
    error?: string;
    thumbnail?: string;
    xhr?: XMLHttpRequest;
    uploadSpeed?: number;
    timeRemaining?: number;
    uploadedBytes?: number;
    startTime?: number;
    r2Cost?: number;
    r2FileKey?: string;
  }>>([]);
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "date-asc" | "date-desc" | "size-asc" | "size-desc">("date-desc");
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareFileId, setShareFileId] = useState<number | null>(null);
  const [shareExpiration, setShareExpiration] = useState<'24h' | '7d' | '30d'>('7d');
  const [sharePassword, setSharePassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [filterSize, setFilterSize] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [draggedFileId, setDraggedFileId] = useState<number | null>(null);
  const [versionHistoryFileId, setVersionHistoryFileId] = useState<number | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [moveToFolder, setMoveToFolder] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [enableCompression, setEnableCompression] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: files, isLoading } = trpc.storage.getFiles.useQuery(
    { folder: selectedFolder },
    { enabled: isAuthenticated && !searchActive }
  );

  const { data: searchResults, isLoading: isSearching } = trpc.storage.searchFiles.useQuery(
    {
      searchTerm,
      mimeType: filterType || undefined,
      minSize: filterSize === 'small' ? 0 : filterSize === 'medium' ? 1024 * 1024 : filterSize === 'large' ? 10 * 1024 * 1024 : undefined,
      maxSize: filterSize === 'small' ? 1024 * 1024 : filterSize === 'medium' ? 10 * 1024 * 1024 : undefined,
    },
    { enabled: isAuthenticated && searchActive && searchTerm.length > 0 }
  );

  const { data: folders } = trpc.storage.getFolders.useQuery(undefined, { enabled: isAuthenticated });

  const createFolderMutation = trpc.storage.createFolder.useMutation({
    onSuccess: () => {
      toast.success("Folder created!");
      utils.storage.getFolders.invalidate();
      setShowNewFolderDialog(false);
      setNewFolderName('');
    },
  });

  const moveFileMutation = trpc.storage.moveFile.useMutation({
    onSuccess: () => {
      toast.success("File moved!");
      utils.storage.getFiles.invalidate();
    },
  });

  const { data: fileVersions } = trpc.storage.getFileVersions.useQuery(
    { fileId: versionHistoryFileId! },
    { enabled: versionHistoryFileId !== null }
  );

  const restoreVersionMutation = trpc.storage.restoreFileVersion.useMutation({
    onSuccess: () => {
      toast.success("File restored to previous version!");
      utils.storage.getFiles.invalidate();
      utils.storage.getFileVersions.invalidate();
      setShowVersionHistory(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to restore version");
    },
  });

  const batchMoveMutation = trpc.storage.moveFile.useMutation({
    onSuccess: () => {
      utils.storage.getFiles.invalidate();
    },
  });

  const uploadMutation = trpc.storage.uploadFile.useMutation({
    onMutate: async (variables) => {
      await utils.storage.getFiles.cancel();
      const previousFiles = utils.storage.getFiles.getData({ folder: selectedFolder });
      
      const optimisticFile = {
        id: Date.now(),
        fileName: variables.fileName,
        fileSize: 0,
        mimeType: variables.mimeType || null,
        folder: variables.folder || '/',
        userId: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        fileUrl: '',
        fileKey: '',
        isDeleted: false,
        versionNumber: 1,
        parentFileId: null,
      };
      
      utils.storage.getFiles.setData(
        { folder: selectedFolder },
        (old) => old ? [optimisticFile, ...old] : [optimisticFile]
      );
      
      toast.success("Uploading...", { duration: 1000 });
      
      return { previousFiles };
    },
    onSuccess: () => {
      toast.success("Upload complete!");
      utils.storage.getFiles.invalidate();
      utils.dashboard.stats.invalidate();
      setIsUploading(false);
      setUploadProgress(0);
    },
    onError: (error, variables, context) => {
      if (context?.previousFiles) {
        utils.storage.getFiles.setData({ folder: selectedFolder }, context.previousFiles);
      }
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
      setSelectedFiles([]);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createShareLinkMutation = trpc.storage.createShareLink.useMutation({
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.shareUrl);
      toast.success("Share link copied to clipboard!");
      setShareDialogOpen(false);
      setSharePassword('');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // R2 Storage mutations
  const uploadFileR2Mutation = trpc.storage.uploadFileR2.useMutation();
  const deleteFileR2Mutation = trpc.storage.deleteFileR2.useMutation();

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedFiles.length} file(s)?`)) return;
    for (const fileId of selectedFiles) {
      await deleteMutation.mutateAsync({ fileId });
    }
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files?.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files?.map(f => f.id) || []);
    }
  };

  const handleShare = (fileId: number) => {
    setShareFileId(fileId);
    setShareDialogOpen(true);
  };

  const handleCreateShareLink = () => {
    if (!shareFileId) return;
    createShareLinkMutation.mutate({
      fileId: shareFileId,
      expiresIn: shareExpiration,
      password: sharePassword || undefined,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect({ target: { files: droppedFiles } } as any);
    }
  };

  const isPreviewable = (mimeType: string | null) => {
    if (!mimeType) return false;
    return mimeType.startsWith('image/') || mimeType === 'application/pdf' || mimeType.startsWith('video/');
  };

  const uploadFile = async (queueItem: { id: string; file: File }) => {
    try {
      let fileToUpload = queueItem.file;
      let originalSize = queueItem.file.size;
      
      // Compress file if enabled and file is large enough (>1MB)
      if (enableCompression && queueItem.file.size > 1024 * 1024) {
        try {
          const arrayBuffer = await queueItem.file.arrayBuffer();
          const compressed = pako.gzip(new Uint8Array(arrayBuffer));
          const compressedBlob = new Blob([compressed], { type: 'application/gzip' });
          
          // Only use compression if it actually reduces size
          if (compressedBlob.size < queueItem.file.size) {
            fileToUpload = new File([compressedBlob], queueItem.file.name + '.gz', { type: 'application/gzip' });
            toast.success(`Compressed ${queueItem.file.name}: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB (${Math.round((1 - compressedBlob.size / originalSize) * 100)}% reduction)`);
          }
        } catch (err) {
          console.error('Compression failed:', err);
          toast.error('Compression failed, uploading uncompressed');
        }
      }
      
      const mimeType = getMimeType(fileToUpload.name, fileToUpload.type);

      // Update status to uploading
      setUploadQueue(prev => prev.map(item => 
        item.id === queueItem.id ? { ...item, status: 'uploading' as const } : item
      ));

      // Convert file to base64 for R2 upload
      const arrayBuffer = await fileToUpload.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = btoa(binary);

      // Upload to R2
      const result = await uploadFileR2Mutation.mutateAsync({
        fileName: fileToUpload.name,
        fileData: base64Data,
        contentType: mimeType,
      });

      // Update progress with cost info
      setUploadQueue(prev => prev.map(item => 
        item.id === queueItem.id ? { 
          ...item, 
          progress: 95,
          r2Cost: result.cost,
          r2FileKey: result.key
        } : item
      ));

      // Mark as completed
      setUploadQueue(prev => prev.map(item => 
        item.id === queueItem.id ? { ...item, progress: 100, status: 'completed' as const } : item
      ));

      toast.success(`${queueItem.file.name} uploaded successfully! Cost: £${result.cost}`);
      utils.storage.getFiles.invalidate();
      utils.dashboard.stats.invalidate();

      setTimeout(() => {
        setUploadQueue(prev => prev.filter(item => item.id !== queueItem.id));
      }, 2000);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadQueue(prev => prev.map(item => 
        item.id === queueItem.id ? { 
          ...item, 
          status: 'error' as const, 
          error: error.message || 'Upload failed' 
        } : item
      ));
      toast.error(`${queueItem.file.name}: ${error.message || 'Upload failed'}`);
    }
  };

  const handlePauseUpload = (id: string) => {
    setUploadQueue(prev => prev.map(item => {
      if (item.id === id && item.xhr) {
        item.xhr.abort();
        return { ...item, status: 'paused' as const };
      }
      return item;
    }));
    toast.info('Upload paused');
  };

  const handleResumeUpload = (id: string) => {
    const item = uploadQueue.find(i => i.id === id);
    if (item) {
      setUploadQueue(prev => prev.map(i => 
        i.id === id ? { ...i, status: 'uploading' as const } : i
      ));
      uploadFile(item);
      toast.info('Upload resumed');
    }
  };

  const handleCancelUpload = (id: string) => {
    setUploadQueue(prev => prev.map(item => {
      if (item.id === id && item.xhr) {
        item.xhr.abort();
      }
      return item;
    }).filter(item => item.id !== id));
    toast.info('Upload cancelled');
  };

  const handleRetryUpload = (id: string) => {
    const item = uploadQueue.find(i => i.id === id);
    if (item) {
      setUploadQueue(prev => prev.map(i => 
        i.id === id ? { ...i, status: 'uploading' as const, progress: 0, error: undefined, startTime: Date.now() } : i
      ));
      uploadFile(item);
      toast.info('Retrying upload...');
    }
  };

  const handleBulkRetry = () => {
    const failedItems = uploadQueue.filter(item => item.status === 'error');
    if (failedItems.length === 0) return;
    setUploadQueue(prev => prev.map(item => 
      item.status === 'error' ? { ...item, status: 'uploading' as const, progress: 0, error: undefined } : item
    ));
    failedItems.forEach(item => uploadFile(item));
    toast.info(`Retrying ${failedItems.length} failed upload(s)...`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFileList = e.target.files;
    if (!selectedFileList) return;

    const newFiles = Array.from(selectedFileList).map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending' as const,
    }));

    setUploadQueue(prev => [...prev, ...newFiles]);
    setIsUploading(true);

    // Start uploading files in batches of 5
    const uploadBatch = async (items: typeof newFiles, batchSize: number = 5) => {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await Promise.all(batch.map(item => uploadFile(item)));
      }
    };

    uploadBatch(newFiles);
  };

  const handleDownload = async (file: any) => {
    try {
      toast.loading('Preparing download...');
      
      // For R2 files, get signed download URL
      if (file.fileKey?.includes('/')) {
        const urlResult = await trpc.storage.getDownloadUrlR2.useQuery({ fileKey: file.fileKey });
        if (urlResult.data?.url) {
          const link = document.createElement('a');
          link.href = urlResult.data.url;
          link.download = file.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.dismiss();
          toast.success('Download started!');
          return;
        }
      }

      // Fallback to direct download
      const link = document.createElement('a');
      link.href = file.fileUrl;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.dismiss();
      toast.success('Download started!');
    } catch (error: any) {
      toast.dismiss();
      toast.error('Download failed: ' + error.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Please log in to access Cloud Storage</p>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayFiles = searchActive ? searchResults : files;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Cloud Storage</h1>
          </div>
        </div>

        {/* Upload Section */}
        <Card
          className={`border-2 border-dashed transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Drag and drop files here or click to browse</p>
                <p className="text-xs text-muted-foreground">Unlimited file size, all file types supported</p>
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
                <Button variant="outline" onClick={() => folderInputRef.current?.click()}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Upload Folder
                </Button>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Checkbox
                  id="compression"
                  checked={enableCompression}
                  onCheckedChange={(checked) => setEnableCompression(checked as boolean)}
                />
                <Label htmlFor="compression" className="text-xs cursor-pointer">
                  Enable compression for large files
                </Label>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={folderInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              {...({ webkitdirectory: 'true' } as any)}
            />
          </CardContent>
        </Card>

        {/* Upload Queue */}
        {uploadQueue.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upload Queue ({uploadQueue.length})</CardTitle>
                {uploadQueue.some(item => item.status === 'error') && (
                  <Button size="sm" onClick={handleBulkRetry} variant="outline">
                    Retry All Failed
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {uploadQueue.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                  {/* Thumbnail */}
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={item.file.name}
                      className="h-12 w-12 rounded object-cover flex-shrink-0"
                    />
                  )}

                  {/* File info and progress */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {item.status === 'completed' && <Check className="h-4 w-4 text-green-500 flex-shrink-0" />}
                          {item.status === 'error' && <X className="h-4 w-4 text-red-500 flex-shrink-0" />}
                          {item.status === 'uploading' && (
                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate">{item.file.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(item.file.size)}
                          </span>
                          {item.r2Cost && (
                            <span className="text-xs text-green-600 font-medium">
                              • Cost: £{item.r2Cost}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {item.status === 'completed' && '• Done'}
                            {item.status === 'error' && '• Failed'}
                            {item.status === 'uploading' && `• ${Math.round(item.progress)}%`}
                            {item.status === 'pending' && '• Waiting...'}
                            {item.status === 'paused' && '• Paused'}
                          </span>
                        </div>
                      </div>

                      {/* Control buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {item.status === 'uploading' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handlePauseUpload(item.id)}
                          >
                            <span className="sr-only">Pause</span>
                            ⏸
                          </Button>
                        )}
                        {item.status === 'paused' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleResumeUpload(item.id)}
                          >
                            <span className="sr-only">Resume</span>
                            ▶
                          </Button>
                        )}
                        {item.status === 'error' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-blue-500 hover:text-blue-600"
                            onClick={() => handleRetryUpload(item.id)}
                            title="Retry upload"
                          >
                            <span className="sr-only">Retry</span>
                            ↻
                          </Button>
                        )}
                        {(item.status === 'uploading' || item.status === 'paused' || item.status === 'pending') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                            onClick={() => handleCancelUpload(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {item.status !== 'pending' && item.status !== 'paused' && (
                      <Progress value={item.progress} className="h-1" />
                    )}

                    {/* Error message */}
                    {item.error && (
                      <p className="text-xs text-red-500">{item.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Files List */}
        {displayFiles && displayFiles.length > 0 ? (
          <div className="grid gap-4">
            {displayFiles.map((file) => (
              <Card key={file.id}>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{file.fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.fileSize)} • {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {isPreviewable(file.mimeType) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewFile(file)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate({ fileId: file.id })}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No files yet. Upload your first file to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
