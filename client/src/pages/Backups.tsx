import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";
import { ArrowLeft, Database, Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Backups() {
  const [backupName, setBackupName] = useState("");
  const [creating, setCreating] = useState(false);
  const utils = trpc.useUtils();

  const { data: backups } = trpc.backups.getBackups.useQuery();

  const createBackupMutation = trpc.backups.createBackup.useMutation({
    onSuccess: () => {
      toast.success("Backup created!");
      utils.backups.getBackups.invalidate();
      setBackupName("");
      setCreating(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteBackupMutation = trpc.backups.deleteBackup.useMutation({
    onSuccess: () => {
      toast.success("Backup deleted");
      utils.backups.getBackups.invalidate();
    },
  });

  const restoreBackupMutation = trpc.backups.restoreBackup.useMutation({
    onSuccess: () => {
      toast.success("Backup restored!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateBackup = () => {
    if (!backupName.trim()) {
      toast.error("Please enter a backup name");
      return;
    }
    createBackupMutation.mutate({ backupName });
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
                <h1 className="text-2xl font-bold">Backups</h1>
                <p className="text-sm text-muted-foreground">Backup and restore your data</p>
              </div>
            </div>
            <Dialog open={creating} onOpenChange={setCreating}>
              <DialogTrigger asChild>
                <Button>
                  <Database className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Backup</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Backup name"
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCreating(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateBackup} disabled={createBackupMutation.isPending}>
                      {createBackupMutation.isPending ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About Backups</CardTitle>
            <CardDescription>
              Backups create a snapshot of all your files and data. You can restore from any backup at any time.
            </CardDescription>
          </CardHeader>
        </Card>

        {backups && backups.length > 0 ? (
          <div className="space-y-4">
            {backups.map((backup) => (
              <Card key={backup.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{backup.backupName}</CardTitle>
                      <CardDescription>
                        {new Date(backup.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreBackupMutation.mutate({ backupId: backup.id })}
                        disabled={restoreBackupMutation.isPending}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteBackupMutation.mutate({ backupId: backup.id })}
                        disabled={deleteBackupMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Size</p>
                      <p className="font-medium">{((backup.backupSize || 0) / (1024 ** 3)).toFixed(2)} GB</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Files</p>
                      <p className="font-medium">{backup.fileCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">{backup.status}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No backups yet. Create your first backup!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
