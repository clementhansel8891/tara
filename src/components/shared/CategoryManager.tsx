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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            Manage Categories
          </DialogTitle>
          <DialogDescription>
            Create and organize categories for your inventory items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <FeedbackAlert message={success} variant="success" onClose={() => setSuccess(null)} />
          <FeedbackAlert message={error} variant="error" onClose={() => setError(null)} />

          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="new-category">New Category Name</Label>
              <Input
                id="new-category"
                placeholder="e.g. Raw Materials"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <Button onClick={handleCreate} disabled={!newName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      No categories found. Start by adding one above.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell>
                        {editingId === cat.id ? (
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="h-8"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium">{cat.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {editingId === cat.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600"
                                onClick={() => handleUpdate(cat.id)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600"
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
                                className="h-8 w-8 text-blue-600"
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
                                className="h-8 w-8 text-red-600"
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
