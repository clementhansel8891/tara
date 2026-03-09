import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  Package,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  Plus,
  Minus,
  Truck,
  ClipboardList,
  ArrowUpDown,
  Edit,
  Trash2,
  CheckCircle,
  Barcode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  mockRetailProducts,
  productCategories,
  Product,
  formatCurrency,
  generateId,
} from "@/lib/mock-data";
import { toast } from "@/hooks/use-toast";
import { useSession } from "@/core/security/session";
import { emitRetailPushEvent } from "@/modules/retail/api/retailGatewayPush";
import { retailService } from "@/core/services/retail/retailService";

interface InventoryItem extends Product {
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  lastRestocked?: string;
  supplier?: string;
}

interface ReorderRequest {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  status: "pending" | "ordered" | "received";
  createdAt: string;
  supplier?: string;
}

// Enhanced inventory data
const initialInventory: InventoryItem[] = mockRetailProducts.map((p) => ({
  ...p,
  minStock: 5,
  maxStock: 100,
  reorderPoint: 10,
  lastRestocked: new Date(
    Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
  ).toISOString(),
  supplier: ["Bean Brothers", "Merch Supply Co", "Gift Direct"][
    Math.floor(Math.random() * 3)
  ],
}));

// Mock reorder requests
const initialReorderRequests: ReorderRequest[] = [
  {
    id: "RO-001",
    productId: "r6",
    productName: "French Press",
    quantity: 20,
    status: "pending",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    supplier: "Merch Supply Co",
  },
];

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  ordered: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  received: "bg-green-500/10 text-green-500 border-green-500/20",
};

const retailers = ["All", ...productCategories];
const suppliers = [
  "Bean Brothers",
  "Merch Supply Co",
  "Gift Direct",
  "Direct Import",
];

export default function RetailInventory() {
  const session = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [reorderRequests, setReorderRequests] = useState(
    initialReorderRequests,
  );

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(
    null,
  );

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    barcode: "",
    minStock: "5",
    maxStock: "100",
    reorderPoint: "10",
    supplier: "",
  });
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [reorderQuantity, setReorderQuantity] = useState(20);

  // Calculate stats
  const lowStockItems = inventory.filter(
    (i) => i.stock !== undefined && i.stock <= i.reorderPoint,
  );
  const outOfStockItems = inventory.filter((i) => i.stock === 0);
  const totalValue = inventory.reduce(
    (sum, i) => sum + (i.stock || 0) * i.price,
    0,
  );
  const pendingOrders = reorderRequests.filter(
    (r) => r.status !== "received",
  ).length;

  // Filter and sort inventory
  const filteredInventory = inventory
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.barcode?.includes(searchTerm);

      if (filterStatus === "low")
        return (
          matchesSearch &&
          item.stock !== undefined &&
          item.stock <= item.reorderPoint
        );
      if (filterStatus === "out") return matchesSearch && item.stock === 0;
      if (filterStatus === "ok")
        return (
          matchesSearch &&
          item.stock !== undefined &&
          item.stock > item.reorderPoint
        );
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "stock-asc") return (a.stock || 0) - (b.stock || 0);
      if (sortBy === "stock-desc") return (b.stock || 0) - (a.stock || 0);
      if (sortBy === "value")
        return (b.stock || 0) * b.price - (a.stock || 0) * a.price;
      return 0;
    });

  const getStockStatus = (item: InventoryItem) => {
    if (!item.stock || item.stock === 0)
      return {
        label: "Out of Stock",
        variant: "destructive" as const,
        color: "text-destructive",
      };
    if (item.stock <= item.reorderPoint)
      return {
        label: "Low Stock",
        variant: "secondary" as const,
        color: "text-yellow-500",
      };
    return {
      label: "In Stock",
      variant: "default" as const,
      color: "text-green-500",
    };
  };

  const getStockPercent = (item: InventoryItem) => {
    if (!item.stock) return 0;
    return Math.min(100, (item.stock / item.maxStock) * 100);
  };

  // Add new item
  const handleAddItem = () => {
    if (!formData.name || !formData.category || !formData.price) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const newItem: InventoryItem = {
      id: generateId(),
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock) || 0,
      barcode: formData.barcode || `SKU-${Date.now()}`, // Fallback if backend call fails or not integrated here yet
      minStock: parseInt(formData.minStock),
      maxStock: parseInt(formData.maxStock),
      reorderPoint: parseInt(formData.reorderPoint),
      supplier: formData.supplier,
      lastRestocked: new Date().toISOString(),
    };

    // If we have a category and session, try to get a real SKU from backend
    if (formData.category && session) {
      void retailService
        .generateSku(session.tenantId, session, formData.category)
        .then((data) => {
          if (data.sku) {
            setInventory((prev) =>
              prev.map((item) =>
                item.id === newItem.id ? { ...item, barcode: data.sku } : item,
              ),
            );
          }
        });
    }

    setInventory((prev) => [...prev, newItem]);
    toast({
      title: "Item added",
      description: `${newItem.name} has been added to inventory`,
    });
    void emitRetailPushEvent({
      type: "inventory.item.created",
      tenantId: session.tenantId,
      payload: {
        id: newItem.id,
        name: newItem.name,
        category: newItem.category,
        price: newItem.price,
        stock: newItem.stock,
        barcode: newItem.barcode,
      },
    });
    setIsAddOpen(false);
    resetForm();
  };

  // Edit item
  const handleEditItem = () => {
    if (
      !selectedProduct ||
      !formData.name ||
      !formData.category ||
      !formData.price
    ) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const updatedItem: InventoryItem = {
      ...selectedProduct,
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock) || 0,
      barcode: formData.barcode,
      minStock: parseInt(formData.minStock),
      maxStock: parseInt(formData.maxStock),
      reorderPoint: parseInt(formData.reorderPoint),
      supplier: formData.supplier,
    };

    setInventory((prev) =>
      prev.map((item) => (item.id === selectedProduct.id ? updatedItem : item)),
    );

    toast({
      title: "Item updated",
      description: `${formData.name} has been updated`,
    });
    void emitRetailPushEvent({
      type: "inventory.item.updated",
      tenantId: session.tenantId,
      payload: {
        id: updatedItem.id,
        name: updatedItem.name,
        category: updatedItem.category,
        price: updatedItem.price,
        stock: updatedItem.stock,
        barcode: updatedItem.barcode,
        previousCategory: selectedProduct.category,
        categoryChanged: selectedProduct.category !== updatedItem.category,
      },
    });
    setIsEditOpen(false);
    setSelectedProduct(null);
    resetForm();
  };

  // Delete item
  const handleDeleteItem = () => {
    if (!selectedProduct) return;

    setInventory((prev) =>
      prev.filter((item) => item.id !== selectedProduct.id),
    );
    toast({
      title: "Item deleted",
      description: `${selectedProduct.name} has been removed from inventory`,
    });
    void emitRetailPushEvent({
      type: "inventory.item.deleted",
      tenantId: session.tenantId,
      payload: {
        id: selectedProduct.id,
        name: selectedProduct.name,
        category: selectedProduct.category,
        price: selectedProduct.price,
        stock: selectedProduct.stock,
        barcode: selectedProduct.barcode,
      },
    });
    setIsDeleteOpen(false);
    setSelectedProduct(null);
  };

  // Handle stock adjustment
  const handleAdjustStock = () => {
    if (!selectedProduct || adjustQuantity === 0) return;

    const previousStock = selectedProduct.stock || 0;
    const newStock = Math.max(0, previousStock + adjustQuantity);
    setInventory((prev) =>
      prev.map((item) =>
        item.id === selectedProduct.id ? { ...item, stock: newStock } : item,
      ),
    );

    toast({
      title: "Stock adjusted",
      description: `${selectedProduct.name}: ${adjustQuantity > 0 ? "+" : ""}${adjustQuantity} units`,
    });
    void emitRetailPushEvent({
      type: "inventory.stock.adjusted",
      tenantId: session.tenantId,
      payload: {
        id: selectedProduct.id,
        name: selectedProduct.name,
        category: selectedProduct.category,
        previousStock,
        newStock,
        delta: adjustQuantity,
        reason: adjustReason || "manual_adjustment",
      },
    });

    setIsAdjustOpen(false);
    setSelectedProduct(null);
    setAdjustQuantity(0);
    setAdjustReason("");
  };

  // Handle reorder request
  const handleCreateReorder = () => {
    if (!selectedProduct || reorderQuantity <= 0) return;

    const newRequest: ReorderRequest = {
      id: `RO-${String(reorderRequests.length + 1).padStart(3, "0")}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: reorderQuantity,
      status: "pending",
      createdAt: new Date().toISOString(),
      supplier: selectedProduct.supplier,
    };

    setReorderRequests((prev) => [newRequest, ...prev]);

    toast({
      title: "Reorder request created",
      description: `${reorderQuantity} units of ${selectedProduct.name} requested`,
    });

    setIsReorderOpen(false);
    setSelectedProduct(null);
    setReorderQuantity(20);
  };

  // Update reorder status
  const updateReorderStatus = (
    id: string,
    status: ReorderRequest["status"],
  ) => {
    setReorderRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    );

    if (status === "received") {
      const request = reorderRequests.find((r) => r.id === id);
      if (request) {
        setInventory((prev) => {
          const next = prev.map((item) =>
            item.id === request.productId
              ? {
                  ...item,
                  stock: (item.stock || 0) + request.quantity,
                  lastRestocked: new Date().toISOString(),
                }
              : item,
          );
          const updated = next.find((item) => item.id === request.productId);
          if (updated) {
            void emitRetailPushEvent({
              type: "inventory.stock.adjusted",
              tenantId: session.tenantId,
              payload: {
                id: updated.id,
                name: updated.name,
                category: updated.category,
                previousStock: (updated.stock || 0) - request.quantity,
                newStock: updated.stock,
                delta: request.quantity,
                reason: "reorder.received",
                reorderId: request.id,
              },
            });
          }
          return next;
        });
        toast({
          title: "Stock received",
          description: `${request.quantity} units of ${request.productName} added to inventory`,
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      price: "",
      stock: "",
      barcode: "",
      minStock: "5",
      maxStock: "100",
      reorderPoint: "10",
      supplier: "",
    });
  };

  const openEditDialog = (item: InventoryItem) => {
    setSelectedProduct(item);
    setFormData({
      name: item.name,
      category: item.category || "",
      price: item.price.toString(),
      stock: item.stock?.toString() || "0",
      barcode: item.barcode || "",
      minStock: item.minStock.toString(),
      maxStock: item.maxStock.toString(),
      reorderPoint: item.reorderPoint.toString(),
      supplier: item.supplier || "",
    });
    setIsEditOpen(true);
  };

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-xl font-bold">
                  {formatCurrency(totalValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-xl font-bold">{lowStockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-xl font-bold">{outOfStockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Truck className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-xl font-bold">{pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Inventory List */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Inventory</CardTitle>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                    <SelectItem value="ok">In Stock</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="stock-asc">Stock (Low)</SelectItem>
                    <SelectItem value="stock-desc">Stock (High)</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => setIsAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products or barcodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[calc(100vh-22rem)]">
              <div className="divide-y">
                {filteredInventory.map((item) => {
                  const status = getStockStatus(item);
                  const stockPercent = getStockPercent(item);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 hover:bg-muted/50"
                    >
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{item.name}</h4>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {item.barcode}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {item.supplier}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Progress
                            value={stockPercent}
                            className="h-2 flex-1"
                          />
                          <span
                            className={cn("text-sm font-medium", status.color)}
                          >
                            {item.stock} / {item.maxStock}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(item.price)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Value:{" "}
                          {formatCurrency((item.stock || 0) * item.price)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProduct(item);
                            setIsAdjustOpen(true);
                          }}
                          title="Adjust Stock"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProduct(item);
                            setReorderQuantity(
                              item.maxStock - (item.stock || 0),
                            );
                            setIsReorderOpen(true);
                          }}
                          title="Reorder"
                        >
                          <Truck className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            setSelectedProduct(item);
                            setIsDeleteOpen(true);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Reorder Requests Panel */}
        <Card className="w-80">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Reorder Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-18rem)]">
              <div className="divide-y">
                {reorderRequests.map((request) => (
                  <div key={request.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{request.id}</span>
                      <Badge
                        variant="outline"
                        className={statusColors[request.status]}
                      >
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{request.productName}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Qty: {request.quantity}</span>
                      <span>{request.supplier}</span>
                    </div>
                    {request.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() =>
                          updateReorderStatus(request.id, "ordered")
                        }
                      >
                        Mark as Ordered
                      </Button>
                    )}
                    {request.status === "ordered" && (
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={() =>
                          updateReorderStatus(request.id, "received")
                        }
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Receive Stock
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter product name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData({ ...formData, category: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Barcode/SKU</Label>
                <div className="relative">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={formData.barcode}
                    onChange={(e) =>
                      setFormData({ ...formData, barcode: e.target.value })
                    }
                    placeholder="Auto-generated if empty"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select
                  value={formData.supplier}
                  onValueChange={(v) =>
                    setFormData({ ...formData, supplier: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Initial Stock</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Min Stock</Label>
                <Input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) =>
                    setFormData({ ...formData, minStock: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max Stock</Label>
                <Input
                  type="number"
                  value={formData.maxStock}
                  onChange={(e) =>
                    setFormData({ ...formData, maxStock: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Reorder At</Label>
                <Input
                  type="number"
                  value={formData.reorderPoint}
                  onChange={(e) =>
                    setFormData({ ...formData, reorderPoint: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData({ ...formData, category: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Barcode/SKU</Label>
                <Input
                  value={formData.barcode}
                  onChange={(e) =>
                    setFormData({ ...formData, barcode: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select
                  value={formData.supplier}
                  onValueChange={(v) =>
                    setFormData({ ...formData, supplier: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Min</Label>
                <Input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) =>
                    setFormData({ ...formData, minStock: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max</Label>
                <Input
                  type="number"
                  value={formData.maxStock}
                  onChange={(e) =>
                    setFormData({ ...formData, maxStock: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Reorder</Label>
                <Input
                  type="number"
                  value={formData.reorderPoint}
                  onChange={(e) =>
                    setFormData({ ...formData, reorderPoint: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditItem}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>{selectedProduct?.name}</strong>? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Package className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{selectedProduct.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Current stock: {selectedProduct.stock} units
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Adjustment Quantity</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setAdjustQuantity((q) => q - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={adjustQuantity}
                    onChange={(e) =>
                      setAdjustQuantity(parseInt(e.target.value) || 0)
                    }
                    className="text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setAdjustQuantity((q) => q + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  New stock level:{" "}
                  {Math.max(0, (selectedProduct.stock || 0) + adjustQuantity)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Select value={adjustReason} onValueChange={setAdjustReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Stock Received</SelectItem>
                    <SelectItem value="damaged">Damaged/Expired</SelectItem>
                    <SelectItem value="count">Physical Count</SelectItem>
                    <SelectItem value="return">Customer Return</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdjustStock}
              disabled={adjustQuantity === 0 || !adjustReason}
            >
              Save Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reorder Dialog */}
      <Dialog open={isReorderOpen} onOpenChange={setIsReorderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Reorder Request</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Package className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{selectedProduct.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Supplier: {selectedProduct.supplier}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 border rounded-lg">
                  <p className="text-muted-foreground">Current Stock</p>
                  <p className="text-xl font-bold">{selectedProduct.stock}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-muted-foreground">Max Stock</p>
                  <p className="text-xl font-bold">
                    {selectedProduct.maxStock}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Order Quantity</Label>
                <Input
                  type="number"
                  value={reorderQuantity}
                  onChange={(e) =>
                    setReorderQuantity(parseInt(e.target.value) || 0)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  After receiving:{" "}
                  {(selectedProduct.stock || 0) + reorderQuantity} units
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReorderOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateReorder}
              disabled={reorderQuantity <= 0}
            >
              <Truck className="h-4 w-4 mr-2" />
              Create Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
