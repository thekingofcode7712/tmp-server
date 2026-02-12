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

export default function CloudStorage() {
  const { isAuthenticated } = useAuth();
  const [selectedFolder, setSelectedFolder] = useState("/");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<Array<{
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      toast.success("Version restored!");
      utils.storage.getFiles.invalidate();
      setShowVersionHistory(false);
    },
  });

  const batchMoveMutation = trpc.storage.moveFile.useMutation({
    onSuccess: () => {
      utils.storage.getFiles.invalidate();
    },
  });

  const uploadMutation = trpc.storage.uploadFile.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await utils.storage.getFiles.cancel();
      
      // Snapshot previous value
      const previousFiles = utils.storage.getFiles.getData({ folder: selectedFolder });
      
      // Optimistically update with new file
      const optimisticFile = {
        id: Date.now(), // Temporary numeric ID
        fileName: variables.fileName,
        fileSize: 0, // Will be updated on success
        mimeType: variables.mimeType || null,
        folder: variables.folder || '/',
        userId: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        fileUrl: '', // Placeholder
        fileKey: '',
        isDeleted: false,
        versionNumber: 1,
        parentFileId: null,
      };
      
      utils.storage.getFiles.setData(
        { folder: selectedFolder },
        (old) => old ? [optimisticFile, ...old] : [optimisticFile]
      );
      
      // Show instant success feedback
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
      // Rollback on error
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

  const isPreviewable = (mimeType: string | null) => {
    if (!mimeType) return false;
    return mimeType.startsWith('image/') || mimeType === 'application/pdf' || mimeType.startsWith('video/');
  };

  const getUploadCredsMutation = trpc.storage.getUploadCredentials.useMutation();
  const registerUploadMutation = trpc.storage.registerDirectUpload.useMutation();

  const uploadFile = async (queueItem: { id: string; file: File }) => {
    try {
      const mimeType = getMimeType(queueItem.file.name, queueItem.file.type);

      // Update status to uploading
      setUploadQueue(prev => prev.map(item => 
        item.id === queueItem.id ? { ...item, status: 'uploading' as const } : item
      ));

      // Step 1: Get upload credentials
      const { uploadUrl, authToken, fileKey } = await getUploadCredsMutation.mutateAsync({
        fileName: queueItem.file.name,
        fileSize: queueItem.file.size,
        mimeType,
        folder: selectedFolder,
      });

      // Step 2: Upload file directly to storage proxy
      const formData = new FormData();
      formData.append('file', queueItem.file, queueItem.file.name);

      const xhr = new XMLHttpRequest();
      const uploadPromise = new Promise<string>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 90;
            setUploadQueue(prev => prev.map(item => 
              item.id === queueItem.id ? { ...item, progress } : item
            ));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response.url);
            } catch {
              reject(new Error('Invalid response from storage'));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error'));
        xhr.ontimeout = () => reject(new Error('Upload timed out'));

        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
        xhr.send(formData);
      });

      const fileUrl = await uploadPromise;
      
      setUploadQueue(prev => prev.map(item => 
        item.id === queueItem.id ? { ...item, progress: 95 } : item
      ));

      // Step 3: Register in database
      await registerUploadMutation.mutateAsync({
        fileKey,
        fileName: queueItem.file.name,
        fileSize: queueItem.file.size,
        mimeType,
        folder: selectedFolder,
        fileUrl,
      });

      // Mark as completed
      setUploadQueue(prev => prev.map(item => 
        item.id === queueItem.id ? { ...item, progress: 100, status: 'completed' as const } : item
      ));

      toast.success(`${queueItem.file.name} uploaded successfully!`);
      utils.storage.getFiles.invalidate();
      utils.dashboard.stats.invalidate();

      // Remove from queue after 2 seconds
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Add all files to queue
    const newQueueItems = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      progress: 0,
      status: 'pending' as const,
    }));

    setUploadQueue(prev => [...prev, ...newQueueItems]);
    toast.info(`Added ${files.length} file(s) to upload queue`);

    // Start uploading files (up to 3 simultaneous)
    const uploadPromises = newQueueItems.slice(0, 3).map(item => uploadFile(item));
    
    // Upload remaining files as previous ones complete
    for (let i = 3; i < newQueueItems.length; i++) {
      await Promise.race(uploadPromises);
      uploadPromises.push(uploadFile(newQueueItems[i]));
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelectOld = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Detect MIME type with fallback
    const mimeType = getMimeType(file.name, file.type);

    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks for faster uploads
    const shouldChunk = file.size > CHUNK_SIZE;
    
    if (shouldChunk) {
      // Chunked upload for large files with parallel processing
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const uploadId = Math.random().toString(36).substring(7);
      
      // Process up to 3 chunks in parallel for faster uploads
      const PARALLEL_UPLOADS = 3;
      const chunks: Promise<void>[] = [];
      
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        
        const uploadPromise = new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const base64 = event.target?.result as string;
              const base64Data = base64.split(',')[1];
              
              await uploadMutation.mutateAsync({
                fileName: file.name,
                fileData: base64Data,
                mimeType,
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
        
        chunks.push(uploadPromise);
        
        // Wait for batch to complete before starting next batch
        if (chunks.length >= PARALLEL_UPLOADS || chunkIndex === totalChunks - 1) {
          await Promise.all(chunks);
          chunks.length = 0;
        }
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
          mimeType,
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

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSearchActive(e.target.value.length > 0);
                  }}
                  className="flex-1"
                />
                {searchActive && (
                  <Button variant="outline" onClick={() => { setSearchTerm(''); setSearchActive(false); }}>
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
              {searchActive && (
                <div className="flex gap-2 flex-wrap">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="File type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="image">Images</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                      <SelectItem value="application/pdf">PDFs</SelectItem>
                      <SelectItem value="text">Documents</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterSize} onValueChange={setFilterSize}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="File size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sizes</SelectItem>
                      <SelectItem value="small">Small (&lt;1MB)</SelectItem>
                      <SelectItem value="medium">Medium (1-10MB)</SelectItem>
                      <SelectItem value="large">Large (&gt;10MB)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Folder Sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Folders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={selectedFolder === '/' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedFolder('/')}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                All Files
              </Button>
              {folders?.map((folder) => (
                <Button
                  key={folder.id}
                  variant={selectedFolder === folder.folderPath ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedFolder(folder.folderPath)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedFileId) {
                      moveFileMutation.mutate({ fileId: draggedFileId, newFolder: folder.folderPath });
                      setDraggedFileId(null);
                    }
                  }}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {folder.folderName}
                </Button>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowNewFolderDialog(true)}
              >
                + New Folder
              </Button>
            </CardContent>
          </Card>

          <div className="md:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{selectedFolder}</span>
              </div>
              <div className="flex items-center gap-2">
            {selectedFiles.length > 0 && (
              <>
                <Select value={moveToFolder} onValueChange={(value) => {
                  setMoveToFolder(value);
                  if (value) {
                    Promise.all(selectedFiles.map(fileId => 
                      batchMoveMutation.mutateAsync({ fileId, newFolder: value })
                    )).then(() => {
                      toast.success(`Moved ${selectedFiles.length} files to ${value}`);
                      setSelectedFiles([]);
                      setMoveToFolder('');
                    });
                  }
                }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Move to folder..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="/">All Files</SelectItem>
                    {folders?.map((folder) => (
                      <SelectItem key={folder.id} value={folder.folderPath}>
                        {folder.folderName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedFiles.length})
                </Button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploadQueue.some(item => item.status === 'uploading')}>
              <Upload className="h-4 w-4 mr-2" />
              {uploadQueue.some(item => item.status === 'uploading') ? "Uploading..." : "Upload File"}
            </Button>
          </div>
        </div>

        {/* Upload Queue */}
        {uploadQueue.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Upload Queue</CardTitle>
              <CardDescription>
                {uploadQueue.filter(item => item.status === 'completed').length} of {uploadQueue.length} files uploaded
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {uploadQueue.map(item => (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {item.status === 'completed' && <Check className="h-4 w-4 text-green-500 flex-shrink-0" />}
                      {item.status === 'error' && <X className="h-4 w-4 text-red-500 flex-shrink-0" />}
                      {item.status === 'uploading' && (
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium truncate">{item.file.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                      {item.status === 'completed' && 'Done'}
                      {item.status === 'error' && 'Failed'}
                      {item.status === 'uploading' && `${Math.round(item.progress)}%`}
                      {item.status === 'pending' && 'Waiting...'}
                    </span>
                  </div>
                  {item.status !== 'pending' && (
                    <Progress value={item.progress} className="h-1" />
                  )}
                  {item.error && (
                    <p className="text-xs text-red-500">{item.error}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between items-center mb-4">
          {files && files.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedFiles.length === files.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedFiles.length > 0 ? `${selectedFiles.length} selected` : 'Select all'}
              </span>
            </div>
          )}
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[200px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="date-desc">Date (Newest first)</SelectItem>
              <SelectItem value="date-asc">Date (Oldest first)</SelectItem>
              <SelectItem value="size-desc">Size (Largest first)</SelectItem>
              <SelectItem value="size-asc">Size (Smallest first)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(isLoading || isSearching) ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (searchActive ? searchResults : files) && (searchActive ? searchResults : files)!.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...(searchActive ? searchResults! : files!)].sort((a, b) => {
              switch (sortBy) {
                case "name-asc":
                  return a.fileName.localeCompare(b.fileName);
                case "name-desc":
                  return b.fileName.localeCompare(a.fileName);
                case "date-asc":
                  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case "date-desc":
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case "size-asc":
                  return (a.fileSize || 0) - (b.fileSize || 0);
                case "size-desc":
                  return (b.fileSize || 0) - (a.fileSize || 0);
                default:
                  return 0;
              }
            }).map((file) => (
              <Card
                key={file.id}
                className={selectedFiles.includes(file.id) ? "ring-2 ring-primary" : ""}
                draggable
                onDragStart={() => setDraggedFileId(file.id)}
                onDragEnd={() => setDraggedFileId(null)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base truncate">{file.fileName}</CardTitle>
                      <CardDescription>
                        {((file.fileSize || 0) / 1024).toFixed(2)} KB
                      </CardDescription>
                    </div>
                    <Checkbox
                      checked={selectedFiles.includes(file.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFiles([...selectedFiles, file.id]);
                        } else {
                          setSelectedFiles(selectedFiles.filter(id => id !== file.id));
                        }
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex gap-2 flex-wrap">
                  {isPreviewable(file.mimeType) && (
                    <Button variant="outline" size="sm" onClick={() => setPreviewFile(file)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleShare(file.id)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    setVersionHistoryFileId(file.id);
                    setShowVersionHistory(true);
                  }}>
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Versions
                  </Button>
                  <Button variant="outline" size="sm" asChild>
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

        {/* File Preview Modal */}
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{previewFile?.fileName}</DialogTitle>
              <DialogDescription>
                {previewFile && ((previewFile.fileSize || 0) / 1024).toFixed(2)} KB
              </DialogDescription>
            </DialogHeader>
            {previewFile && (
              <div className="mt-4">
                {previewFile.mimeType?.startsWith('image/') && (
                  <img src={previewFile.fileUrl} alt={previewFile.fileName} className="w-full h-auto rounded" />
                )}
                {previewFile.mimeType === 'application/pdf' && (
                  <iframe src={previewFile.fileUrl} className="w-full h-[600px] rounded" />
                )}
                {previewFile.mimeType?.startsWith('video/') && (
                  <video src={previewFile.fileUrl} controls className="w-full h-auto rounded" />
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share File</DialogTitle>
              <DialogDescription>
                Create a shareable link with optional password protection
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Expiration</Label>
                <Select value={shareExpiration} onValueChange={(value: any) => setShareExpiration(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24 hours</SelectItem>
                    <SelectItem value="7d">7 days</SelectItem>
                    <SelectItem value="30d">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Password (optional)</Label>
                <Input
                  type="password"
                  placeholder="Leave empty for no password"
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                />
              </div>
              <Button
                onClick={handleCreateShareLink}
                disabled={createShareLinkMutation.isPending}
                className="w-full"
              >
                {createShareLinkMutation.isPending ? "Creating..." : "Create Share Link"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Version History Dialog */}
        <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Version History</DialogTitle>
              <DialogDescription>
                View and restore previous versions of this file
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto">
              {fileVersions && fileVersions.length > 0 ? (
                fileVersions.map((version) => (
                  <Card key={version.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm">{version.fileName}</CardTitle>
                          <CardDescription>
                            Version {version.versionNumber} • {((version.fileSize || 0) / 1024).toFixed(2)} KB • {new Date(version.createdAt).toLocaleString()}
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restoreVersionMutation.mutate({ fileId: versionHistoryFileId!, versionNumber: version.versionNumber })}
                          disabled={restoreVersionMutation.isPending}
                        >
                          {restoreVersionMutation.isPending ? "Restoring..." : "Restore"}
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No version history available</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* New Folder Dialog */}
        <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Enter a name for your new folder
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <Button
                onClick={() => createFolderMutation.mutate({ folderName: newFolderName })}
                disabled={!newFolderName || createFolderMutation.isPending}
                className="w-full"
              >
                {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
