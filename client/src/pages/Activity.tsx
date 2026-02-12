import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, HardDrive, Database, LinkIcon, Download, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function Activity() {
  const { isAuthenticated } = useAuth();
  const [filterType, setFilterType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    window.location.href = '/login';
    return null;
  }

  const allActivity = stats?.recentActivity || [];
  const filteredActivity = filterType === "all" 
    ? allActivity 
    : allActivity.filter((activity: any) => activity.type === filterType);

  const totalPages = Math.ceil(filteredActivity.length / ITEMS_PER_PAGE);
  const paginatedActivity = filteredActivity.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload': return <HardDrive className="h-5 w-5 text-green-500" />;
      case 'delete': return <Database className="h-5 w-5 text-red-500" />;
      case 'share': return <LinkIcon className="h-5 w-5 text-blue-500" />;
      case 'move': return <Download className="h-5 w-5 text-yellow-500" />;
      default: return <HardDrive className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'upload': return 'bg-green-500/10 border-green-500/20';
      case 'delete': return 'bg-red-500/10 border-red-500/20';
      case 'share': return 'bg-blue-500/10 border-blue-500/20';
      case 'move': return 'bg-yellow-500/10 border-yellow-500/20';
      default: return 'bg-muted/10 border-border';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Activity History</h1>
                <p className="text-sm text-muted-foreground">
                  View all your file operations and changes
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  {filteredActivity.length} {filterType === "all" ? "total" : filterType} activities
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activities</SelectItem>
                    <SelectItem value="upload">Uploads</SelectItem>
                    <SelectItem value="delete">Deletions</SelectItem>
                    <SelectItem value="share">Shares</SelectItem>
                    <SelectItem value="move">Moves</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paginatedActivity.length > 0 ? (
              <div className="space-y-3">
                {paginatedActivity.map((activity: any, index: number) => (
                  <Card key={index} className={`border ${getActivityColor(activity.type)}`}>
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className="mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {activity.fileId && (
                        <Link href="/storage">
                          <Button variant="outline" size="sm">
                            View File
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No activity found</p>
                <p className="text-sm text-muted-foreground">
                  {filterType === "all" 
                    ? "Start uploading files to see your activity here"
                    : `No ${filterType} activities yet`}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
