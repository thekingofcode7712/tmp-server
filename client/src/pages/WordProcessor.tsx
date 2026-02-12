import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Save, Download, FileText, Trash2, Cloud
} from "lucide-react";

export default function WordProcessor() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [currentDoc, setCurrentDoc] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: docs, refetch } = trpc.documents.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createMutation = trpc.documents.create.useMutation({
    onSuccess: (data) => {
      setCurrentDoc(data);
      toast.success("Document created");
      refetch();
    },
  });

  const updateMutation = trpc.documents.update.useMutation({
    onSuccess: () => {
      setIsSaving(false);
      toast.success("Document saved");
      refetch();
    },
  });

  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      setCurrentDoc(null);
      setTitle("");
      setContent("");
      toast.success("Document deleted");
      refetch();
    },
  });

  const exportMutation = trpc.documents.export.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.content], { type: data.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${data.format.toUpperCase()}`);
    },
  });

  const saveToCloudMutation = trpc.documents.saveToCloud.useMutation({
    onSuccess: (data) => {
      toast.success(`Saved to cloud storage: ${data.filename}`);
    },
    onError: (error) => {
      toast.error(`Failed to save to cloud: ${error.message}`);
    },
  });

  useEffect(() => {
    if (docs) {
      setDocuments(docs);
    }
  }, [docs]);

  useEffect(() => {
    // Auto-save every 30 seconds
    if (currentDoc && content) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      autoSaveTimer.current = setTimeout(() => {
        handleSave();
      }, 30000);
    }
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [content, currentDoc]);

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleNewDocument = () => {
    const newTitle = `Untitled Document ${documents.length + 1}`;
    setTitle(newTitle);
    setContent("");
    setCurrentDoc(null);
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    setIsSaving(true);
    const wordCount = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;

    if (currentDoc) {
      updateMutation.mutate({
        id: currentDoc.id,
        title,
        content,
        wordCount,
      });
    } else {
      createMutation.mutate({
        title,
        content,
        wordCount,
      });
    }
  };

  const handleLoadDocument = (doc: any) => {
    setCurrentDoc(doc);
    setTitle(doc.title);
    setContent(doc.content);
    if (editorRef.current) {
      editorRef.current.innerHTML = doc.content;
    }
  };

  const handleDelete = () => {
    if (currentDoc && confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate({ id: currentDoc.id });
    }
  };

  const handleExport = (format: 'docx' | 'pdf') => {
    if (!currentDoc) {
      toast.error("Please save the document first");
      return;
    }
    exportMutation.mutate({ id: currentDoc.id, format });
  };

  const handleSaveToCloud = (format: 'docx' | 'pdf' | 'html') => {
    if (!currentDoc) {
      toast.error("Please save the document first");
      return;
    }
    saveToCloudMutation.mutate({ id: currentDoc.id, format });
  };

  const wordCount = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(w => w).length;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Word Processor</h1>
        <div className="flex gap-2">
          <Button onClick={handleNewDocument} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            New Document
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Document List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>My Documents</CardTitle>
            <CardDescription>{documents.length} documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleLoadDocument(doc)}
                  className={`p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                    currentDoc?.id === doc.id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="font-medium truncate">{doc.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {doc.wordCount} words
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No documents yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document Title"
                  className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0"
                />
                <div className="text-sm text-muted-foreground mt-2">
                  {wordCount} words
                </div>
              </div>
              <div className="flex gap-2">
                {currentDoc && (
                  <>
                    <Button onClick={handleDelete} variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => handleExport('docx')} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      DOCX
                    </Button>
                    <Button onClick={() => handleExport('pdf')} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <div className="h-6 w-px bg-border" />
                    <Button onClick={() => handleSaveToCloud('html')} variant="outline" size="sm">
                      <Cloud className="w-4 h-4 mr-2" />
                      Save HTML to Cloud
                    </Button>
                    <Button onClick={() => handleSaveToCloud('docx')} variant="outline" size="sm">
                      <Cloud className="w-4 h-4 mr-2" />
                      Save DOCX to Cloud
                    </Button>
                  </>
                )}
                <Button onClick={handleSave} disabled={isSaving} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 bg-muted rounded-lg mb-4">
              <Button
                onClick={() => handleFormat('bold')}
                variant="ghost"
                size="sm"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleFormat('italic')}
                variant="ghost"
                size="sm"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleFormat('underline')}
                variant="ghost"
                size="sm"
                title="Underline"
              >
                <Underline className="w-4 h-4" />
              </Button>
              <div className="w-px bg-border mx-1" />
              <Button
                onClick={() => handleFormat('justifyLeft')}
                variant="ghost"
                size="sm"
                title="Align Left"
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleFormat('justifyCenter')}
                variant="ghost"
                size="sm"
                title="Align Center"
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleFormat('justifyRight')}
                variant="ghost"
                size="sm"
                title="Align Right"
              >
                <AlignRight className="w-4 h-4" />
              </Button>
              <div className="w-px bg-border mx-1" />
              <Button
                onClick={() => handleFormat('insertUnorderedList')}
                variant="ghost"
                size="sm"
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleFormat('insertOrderedList')}
                variant="ghost"
                size="sm"
                title="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </Button>
              <div className="w-px bg-border mx-1" />
              <select
                onChange={(e) => handleFormat('formatBlock', e.target.value)}
                className="px-2 py-1 text-sm rounded border bg-background"
              >
                <option value="p">Normal</option>
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
              </select>
            </div>

            {/* Editor */}
            <div
              ref={editorRef}
              contentEditable
              onInput={(e) => setContent(e.currentTarget.innerHTML)}
              className="min-h-[500px] p-6 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary prose prose-sm max-w-none"
              style={{ lineHeight: '1.6' }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
