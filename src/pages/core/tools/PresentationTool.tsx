import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/core/ui/PageHeader";
import { PageShell } from "@/core/ui/PageShell";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { Input } from "@/components/ui/input";
import { useSession } from "@/core/security/session";
import {
  listFileSystem,
  getFile,
  updateFileContent,
  uploadFile,
  deleteFile,
  generateForensicCode,
  moveToRecycle,
} from "@/core/tools/explorer/service";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { Download } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import { useCollaboration } from "@/hooks/useCollaboration";

type Slide = {
  id: string;
  title: string;
  body: string;
};

const createSlide = (index: number): Slide => ({
  id: `slide-${index}`,
  title: `Slide ${index}`,
  body: "Add your content here...",
});

export default function PresentationTool() {
  const session = useSession();
  const [searchParams] = useSearchParams();
  const fileId = searchParams.get("fileId");

  const [slides, setSlides] = useState<Slide[]>([createSlide(1)]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [version, setVersion] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(fileId);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("Untitled Deck");

  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFile = async () => {
      if (fileId) {
        setLoading(true);
        try {
          const file = await getFile(session, fileId);
          setTitle(file.name);
          if (file.content) {
            try {
              setSlides(JSON.parse(file.content));
            } catch {
              setSlides([createSlide(1)]);
            }
          }
          setSelectedId(file.id);
        } catch (err) {
          console.error("Failed to load deck", err);
        } finally {
          setLoading(false);
        }
      }
    };
    loadFile();
  }, [fileId, session]);

  useEffect(() => {
    const fetchSlides = async () => {
      const { files } = await listFileSystem(session);
      setFiles(files.filter(f => f.type === "slide" || f.type === "zslide"));
    };
    fetchSlides();
  }, [session, version]);

  const { presence, lastChange, broadcastChange } = useCollaboration(
    selectedId,
    session.user_id,
    `${session.first_name} ${session.last_name}`
  );

  useEffect(() => {
    if (lastChange && Array.isArray(lastChange)) {
      setSlides(lastChange);
    }
  }, [lastChange]);

  const activeSlide = slides[activeIndex];

  const addSlide = () => {
    setSlides((prev) => [...prev, createSlide(prev.length + 1)]);
    setActiveIndex(slides.length);
  };

  const updateSlide = (patch: Partial<Slide>) => {
    setSlides((prev) => {
      const next = prev.map((slide, index) =>
        index === activeIndex ? { ...slide, ...patch } : slide,
      );
      broadcastChange(next);
      return next;
    });
  };

  const removeSlide = () => {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, index) => index !== activeIndex));
    setActiveIndex((prev) => Math.max(0, prev - 1));
  };

  return (
    <PageShell
      header={
        <PageHeader
          title="Slides"
          subtitle="Build presentations with reusable decks."
          primaryAction={
            <Button
              onClick={async () => {
                const content = JSON.stringify(slides);
                if (selectedId) {
                  await updateFileContent(session, selectedId, content, title);
                } else {
                  const file = new File([content], `${title}.zslide`, { type: "application/json" });
                  const record = await uploadFile(session, file);
                  setSelectedId(record.id);
                }
                setVersion((prev) => prev + 1);
              }}
            >
              Save to Explorer
            </Button>
          }
          secondaryActions={
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 overflow-hidden mr-2">
                {Object.values(presence).map((p, i) => (
                  <div 
                    key={i} 
                    title={p.userName}
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-primary/10 flex items-center justify-center text-[10px] font-bold border"
                  >
                    {p.userName.split(" ").map(n => n[0]).join("")}
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={() => window.print()}>
                Print
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Legacy export still available
                  alert("Forensic PDF Export is recommended for production.");
                }}
              >
                Local Export
              </Button>
              <Button 
                variant="default"
                disabled={!selectedId}
                onClick={async () => {
                  const code = await generateForensicCode(session);
                  const url = `${API_BASE_URL}/explorer/files/${selectedId}/download?traceId=${code}&watermarkText=CONFIDENTIAL`;
                  window.open(url, "_blank");
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Secure Export
              </Button>
            </div>
          }
        />
      }
    >
      <div className="space-y-6">
        <WorkspacePanel title="Explorer" description="Department-scoped slide decks.">
          <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
            <div className="space-y-3">
              <Input
                placeholder="Search decks"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <div className="space-y-2">
                {loading ? (
                   <div className="p-4 text-center text-sm text-muted-foreground italic">Loading decks...</div>
                ) : files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between rounded-lg border p-2">
                    <button
                      className="text-left text-sm font-medium text-foreground"
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const fullFile = await getFile(session, file.id);
                          setSelectedId(fullFile.id);
                          setTitle(fullFile.name);
                          if (fullFile.content) {
                            try {
                              setSlides(JSON.parse(fullFile.content));
                              setActiveIndex(0);
                            } catch {
                              setSlides([createSlide(1)]);
                            }
                          }
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      {file.name}
                    </button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await moveToRecycle(session, file.id);
                        setVersion((prev) => prev + 1);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                Slides: {slides.length}
              </div>
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Slides" description="Organize your slide deck.">
          <div className="flex flex-wrap items-center gap-2">
            {slides.map((slide, index) => (
              <Button
                key={slide.id}
                variant={index === activeIndex ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveIndex(index)}
              >
                {slide.title}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={addSlide}>
              Add slide
            </Button>
            <Button variant="outline" size="sm" onClick={removeSlide}>
              Remove
            </Button>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Slide editor" description="Edit title and content.">
          <div className="grid gap-4">
            <Input
              value={activeSlide.title}
              onChange={(event) => updateSlide({ title: event.target.value })}
            />
            <textarea
              className="min-h-[280px] w-full rounded-lg border bg-background p-4 text-sm"
              value={activeSlide.body}
              onChange={(event) => updateSlide({ body: event.target.value })}
            />
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Recycle bin" description="Only owners/admins can restore.">
          {listRecycleBin(session.tenant_id, session, "slide").length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Recycle bin is empty.
            </div>
          ) : (
            <div className="space-y-2">
              {listRecycleBin(session.tenant_id, session, "slide").map((file) => (
                <div key={file.id} className="flex items-center justify-between rounded-lg border p-2">
                  <div className="text-sm">{file.name}</div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      restoreFromRecycle(session.tenant_id, session, file.id);
                      setVersion((prev) => prev + 1);
                    }}
                  >
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </WorkspacePanel>
      </div>
    </PageShell>
  );
}
