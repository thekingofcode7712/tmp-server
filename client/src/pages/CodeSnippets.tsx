import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { ArrowLeft, Plus, Code, Save, Trash2, Copy } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CodeSnippets() {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [tags, setTags] = useState("");

  const { data: snippets, refetch } = trpc.snippets.getAll.useQuery();
  
  const createMutation = trpc.snippets.create.useMutation({
    onSuccess: () => {
      toast.success("Snippet saved!");
      setIsCreating(false);
      setTitle("");
      setDescription("");
      setCode("");
      setTags("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.snippets.delete.useMutation({
    onSuccess: () => {
      toast.success("Snippet deleted");
      refetch();
    },
  });

  const handleSave = () => {
    if (!title.trim() || !code.trim()) {
      toast.error("Title and code are required");
      return;
    }

    createMutation.mutate({
      title,
      description,
      code,
      language,
      tags,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
                <h1 className="text-2xl font-bold">Code Snippets Library</h1>
                <p className="text-sm text-muted-foreground">Save and manage your code examples</p>
              </div>
            </div>
            <Button onClick={() => setIsCreating(!isCreating)}>
              <Plus className="h-4 w-4 mr-2" />
              New Snippet
            </Button>
          </div>
        </div>
      </header>

      <div className="container flex-1 py-8 max-w-6xl">
        {isCreating && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Snippet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="e.g., React useState Hook"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Optional description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Language</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="csharp">C#</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                  <option value="php">PHP</option>
                  <option value="ruby">Ruby</option>
                  <option value="sql">SQL</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Code</label>
                <Textarea
                  placeholder="Paste your code here..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="font-mono text-sm min-h-[200px]"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  placeholder="e.g., react, hooks, state"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={createMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Snippet
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {snippets && snippets.length === 0 && (
            <div className="text-center py-12">
              <Code className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No snippets yet</p>
              <p className="text-sm text-muted-foreground mt-2">Create your first code snippet to get started</p>
            </div>
          )}

          {snippets?.map((snippet: any) => (
            <Card key={snippet.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      {snippet.title}
                    </CardTitle>
                    {snippet.description && (
                      <p className="text-sm text-muted-foreground mt-1">{snippet.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(snippet.code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate({ id: snippet.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {snippet.language}
                  </span>
                  {snippet.tags && snippet.tags.split(',').map((tag: string, i: number) => (
                    <span key={i} className="text-xs bg-muted px-2 py-1 rounded">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm font-mono">{snippet.code}</code>
                </pre>
                <p className="text-xs text-muted-foreground mt-2">
                  Created {new Date(snippet.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
