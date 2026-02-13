import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, Smartphone, Apple, Trash2, Upload, Calendar, Package } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function AppBuilds() {
  const { user } = useAuth();
  const { data: builds, isLoading, refetch } = trpc.appBuilds.getAllBuilds.useQuery();
  
  const incrementDownload = trpc.appBuilds.incrementDownload.useMutation();
  const deleteBuild = trpc.appBuilds.deleteBuild.useMutation({
    onSuccess: () => {
      toast.success("Build deleted", {
        description: "The build has been removed successfully.",
      });
      refetch();
    },
  });

  const handleDownload = async (build: any) => {
    // Increment download count
    await incrementDownload.mutateAsync({ buildId: build.id });
    
    // Open download link
    window.open(build.fileUrl, '_blank');
    
    toast.success("Download started", {
      description: `Downloading ${build.platform === 'ios' ? 'iOS' : 'Android'} build v${build.version}`,
    });
  };

  const handleDelete = async (buildId: number) => {
    if (confirm("Are you sure you want to delete this build?")) {
      await deleteBuild.mutateAsync({ buildId });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  const iosBuilds = builds?.filter(b => b.platform === 'ios') || [];
  const androidBuilds = builds?.filter(b => b.platform === 'android') || [];

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">App Builds</h1>
          <p className="text-muted-foreground">
            Download and manage TMP Server mobile app builds
          </p>
        </div>
        {user?.id === 1 && (
          <Link href="/app-build-upload">
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload New Build
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading builds...</p>
        </div>
      ) : !builds || builds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No builds available</h3>
            <p className="text-muted-foreground mb-4">
              There are no app builds uploaded yet.
            </p>
            {user?.id === 1 && (
              <Link href="/app-build-upload">
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload First Build
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* iOS Builds */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Apple className="h-5 w-5" />
                <CardTitle>iOS Builds</CardTitle>
              </div>
              <CardDescription>
                {iosBuilds.length} build{iosBuilds.length !== 1 ? 's' : ''} available
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {iosBuilds.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No iOS builds available
                </p>
              ) : (
                iosBuilds.map((build) => (
                  <div key={build.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">Version {build.version}</h3>
                          <Badge variant="outline">Build {build.buildNumber}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(build.createdAt), { addSuffix: true })}
                          </span>
                          <span>{formatFileSize(Number(build.fileSize))}</span>
                          <span>{build.downloadCount} downloads</span>
                        </div>
                      </div>
                    </div>
                    
                    {build.releaseNotes && (
                      <p className="text-sm text-muted-foreground">
                        {build.releaseNotes}
                      </p>
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDownload(build)}
                        size="sm"
                        className="flex-1"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      {user?.id === 1 && (
                        <Button
                          onClick={() => handleDelete(build.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Android Builds */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                <CardTitle>Android Builds</CardTitle>
              </div>
              <CardDescription>
                {androidBuilds.length} build{androidBuilds.length !== 1 ? 's' : ''} available
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {androidBuilds.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No Android builds available
                </p>
              ) : (
                androidBuilds.map((build) => (
                  <div key={build.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">Version {build.version}</h3>
                          <Badge variant="outline">Build {build.buildNumber}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(build.createdAt), { addSuffix: true })}
                          </span>
                          <span>{formatFileSize(Number(build.fileSize))}</span>
                          <span>{build.downloadCount} downloads</span>
                        </div>
                      </div>
                    </div>
                    
                    {build.releaseNotes && (
                      <p className="text-sm text-muted-foreground">
                        {build.releaseNotes}
                      </p>
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDownload(build)}
                        size="sm"
                        className="flex-1"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      {user?.id === 1 && (
                        <Button
                          onClick={() => handleDelete(build.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
