import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function FilterListsManager() {
  const [newListName, setNewListName] = useState("");
  const [newListUrl, setNewListUrl] = useState("");

  const { data: filterLists, refetch } = trpc.adBlocker.getFilterLists.useQuery();

  const addMutation = trpc.adBlocker.addFilterList.useMutation({
    onSuccess: () => {
      toast.success("Filter list added");
      setNewListName("");
      setNewListUrl("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.adBlocker.updateFilterList.useMutation({
    onSuccess: () => {
      toast.success("Filter list updated");
      refetch();
    },
  });

  const deleteMutation = trpc.adBlocker.deleteFilterList.useMutation({
    onSuccess: () => {
      toast.success("Filter list deleted");
      refetch();
    },
  });

  const handleAdd = () => {
    if (!newListName.trim()) {
      toast.error("Please enter a name");
      return;
    }
    addMutation.mutate({ name: newListName, url: newListUrl || undefined });
  };

  const handleToggle = (id: number, isEnabled: boolean) => {
    updateMutation.mutate({ id, isEnabled });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this filter list?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Filter Lists</CardTitle>
        <CardDescription>
          Add custom filter lists or import from URLs (EasyList, EasyPrivacy, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new filter list */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="listName">Filter List Name</Label>
            <Input
              id="listName"
              placeholder="e.g., My Custom Rules"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="listUrl">URL (optional)</Label>
            <Input
              id="listUrl"
              placeholder="https://example.com/filters.txt"
              value={newListUrl}
              onChange={(e) => setNewListUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for manual rules, or provide a URL to import filter lists
            </p>
          </div>
          <Button onClick={handleAdd} disabled={addMutation.isPending} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Filter List
          </Button>
        </div>

        {/* Existing filter lists */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Your Filter Lists</h4>
          {!filterLists || filterLists.length === 0 ? (
            <p className="text-sm text-muted-foreground">No custom filter lists yet</p>
          ) : (
            <div className="space-y-2">
              {filterLists.map((list) => (
                <div
                  key={list.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium">{list.name}</h5>
                      {list.url && (
                        <a
                          href={list.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {list.url && (
                      <p className="text-xs text-muted-foreground truncate max-w-md">
                        {list.url}
                      </p>
                    )}
                    {list.lastUpdated && (
                      <p className="text-xs text-muted-foreground">
                        Last updated: {new Date(list.lastUpdated).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={list.isEnabled}
                      onCheckedChange={(checked) => handleToggle(list.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(list.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular filter lists */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Popular Filter Lists</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <div>
                <p className="font-medium">EasyList</p>
                <p className="text-xs text-muted-foreground">Primary ad blocking filter list</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewListName("EasyList");
                  setNewListUrl("https://easylist.to/easylist/easylist.txt");
                }}
              >
                Use
              </Button>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <div>
                <p className="font-medium">EasyPrivacy</p>
                <p className="text-xs text-muted-foreground">Blocks tracking and analytics</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewListName("EasyPrivacy");
                  setNewListUrl("https://easylist.to/easylist/easyprivacy.txt");
                }}
              >
                Use
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
