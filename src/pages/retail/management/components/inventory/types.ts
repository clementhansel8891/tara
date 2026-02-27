export type InventoryItemView = {
  id: string;
  sku: string;
  name: string;
  category: string;
  onHand: number;
  reserved: number;
  available: number;
  minBuffer: number;
  status: "ok" | "low" | "critical" | "overstock";
};

export type InventoryFilters = {
  search: string;
  status: string;
  category: string;
  sortBy: "name-asc" | "name-desc" | "price-asc" | "price-desc";
};
