import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Edit2, Save, X, FolderTree } from "lucide-react";
import { inventoryService } from "@/core/services/inventory/inventoryService";
import { useSession } from "@/core/security/session";
import { FeedbackAlert } from "@/core/tools/FeedbackAlert";

interface Category {
  id: string;
  name: string;
  parent_id?: string;
  icon?: string;
}

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChange?: () => void;
}

export function CategoryManager({ isOpen, onClose, onCategoriesChange }: CategoryManagerProps) {
  const { session } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCategories = async () => {
    if (!session?.tenant_id) return;
    setLoading(true);
    try {
      const data = await inventoryService.listCategories(session.tenant_id, session);
      setCategories(data);
    } catch (err: any) {
      setError("Failed to fetch categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!newName.trim() || !session?.tenant_id) return;
    try {
      await inventoryService.createCategory(session.tenant_id, session, { name: newName.trim() });
      setNewName("");
      setSuccess("Category created successfully.");
      fetchCategories();
      onCategoriesChange?.();
    } catch (err: any) {
      setError(err.message || "Failed to create category.");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim() || !session?.tenant_id) return;
    try {
      await inventoryService.updateCategory(session.tenant_id, session, id, { name: editingName.trim() });
      setEditingId(null);
      setSuccess("Category updated successfully.");
      fetchCategories();
      onCategoriesChange?.();
    } catch (err: any) {
      setError(err.message || "Failed to update category.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!session?.tenant_id) return;
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await inventoryService.deleteCategory(session.tenant_id, session, id);
      setSuccess("Category deleted successfully.");
      fetchCategories();
      onCategoriesChange?.();
    } catch (err: any) {
      setError(err.message || "Failed to delete category.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-[3rem] border-white/10 bg-slate-900/90 backdrop-blur-3xl shadow-2xl sm:max-w-[700px] p-0 overflow-hidden max-h-[85vh]">
        <DialogHeader className="p-10 bg-white/5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-5 text-3xl font-black tracking-tighter text-white uppercase italic leading-none">
                <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 border border-white/20">
                  <FolderTree className="h-7 w-7" />
                </div>
                Category Manager
              </DialogTitle>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mt-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> CLASSIFICATION_ENGINE_V2
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-white/5 text-slate-500 hover:text-white" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
          <FeedbackAlert message={success} variant="success" onClose={() => setSuccess(null)} />
          <FeedbackAlert message={error} variant="error" onClose={() => setError(null)} />

          <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 space-y-6">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Initialize New Node</p>
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-3">
                <Label htmlFor="new-category" className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Label Designation</Label>
                <Input
                  id="new-category"
                  placeholder="e.g. RAW_MATERIALS_01"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  className="h-14 rounded-xl bg-slate-950 border-white/5 text-white shadow-inner font-black italic tracking-widest placeholder:text-slate-700 focus:border-indigo-500 transition-all"
                />
              </div>
              <Button 
                onClick={handleCreate} 
                disabled={!newName.trim()}
                className="h-14 px-8 rounded-xl bg-white text-slate-950 font-black italic uppercase tracking-widest text-[10px] hover:bg-slate-100 shadow-2xl transition-all hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Commit
              </Button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/5 bg-slate-950 overflow-hidden shadow-2xl">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/5 hover:bg-transparent bg-white/5">
                  <TableHead className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Node Label</TableHead>
                  <TableHead className="p-6 w-[150px] text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Operation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={2} className="text-center py-20 text-slate-600 italic font-black uppercase tracking-widest text-xs">
                      No classification nodes found. Initialization required.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((cat, i) => (
                    <TableRow key={cat.id} className={cn("group hover:bg-white/5 transition-all duration-300 border-white/5", i === categories.length - 1 && "border-0")}>
                      <TableCell className="p-6">
                        {editingId === cat.id ? (
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="h-12 rounded-lg bg-white/5 border-white/10 text-white font-black italic tracking-widest"
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && handleUpdate(cat.id)}
                          />
                        ) : (
                          <div className="flex items-center gap-4">
                             <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                <FolderTree className="h-4 w-4 text-indigo-400" />
                             </div>
                             <span className="font-black text-white italic tracking-tight uppercase text-base">{cat.name}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="p-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {editingId === cat.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl text-emerald-400 hover:bg-emerald-500/20"
                                onClick={() => handleUpdate(cat.id)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl text-rose-400 hover:bg-rose-500/20"
                                onClick={() => setEditingId(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl text-indigo-400 hover:bg-indigo-500/20"
                                onClick={() => {
                                  setEditingId(cat.id);
                                  setEditingName(cat.name);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10"
                                onClick={() => handleDelete(cat.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="p-10 bg-white/5 border-t border-white/5">
          <Button 
             variant="outline" 
             className="rounded-xl font-black italic text-[10px] uppercase tracking-widest h-12 px-8 border-white/10 bg-white/5 text-white hover:bg-white/10" 
             onClick={onClose}
          >
             Termination Protocol
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
