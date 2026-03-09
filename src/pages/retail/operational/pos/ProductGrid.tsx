import React from "react";
import { Package, Hash, Plus } from "lucide-react";
import { RetailProduct } from "@/core/types/retail/retail";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductGridProps {
  products: RetailProduct[];
  onAddToCart: (product: RetailProduct) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((p) => (
        <Card
          key={p.id}
          className="group cursor-pointer border-2 border-white/40 backdrop-blur-xl bg-white/30 hover:bg-white/60 hover:border-indigo-500/50 hover:shadow-[0_20px_60px_-15px_rgba(79,70,229,0.15)] hover:-translate-y-1.5 transition-all duration-500 active:scale-95 overflow-hidden rounded-[2rem] relative"
          onClick={() => onAddToCart(p)}
        >
          <div className="aspect-square bg-slate-50/50 flex items-center justify-center p-10 group-hover:bg-indigo-50/50 transition-colors relative overflow-hidden">
            <Package className="w-12 h-12 text-slate-200 group-hover:text-indigo-300 transition-all duration-500 group-hover:scale-110" />

            <div className="absolute top-5 right-5 p-2.5 bg-white rounded-xl shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              <Plus className="w-4 h-4 text-indigo-600" />
            </div>

            <div className="absolute bottom-5 left-5">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-slate-500 border border-slate-100/50 shadow-sm leading-none">
                {p.categoryName || "GLOBAL"}
              </span>
            </div>

            {/* Hover Decor */}
            <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="p-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-2 leading-snug tracking-tight">
                {p.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Hash className="w-3 h-3 text-slate-300" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter font-mono">
                  {p.sku}
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between mt-auto gap-2">
              <div className="flex flex-col min-w-0 pr-1">
                <span className="text-[9px] font-black text-indigo-500/40 uppercase tracking-widest italic leading-none mb-1">
                  Value
                </span>
                <span className="text-lg font-black text-slate-900 italic leading-none truncate">
                  Rp {p.price.toLocaleString()}
                </span>
              </div>
              <Badge
                variant="outline"
                className="text-[9px] font-black uppercase py-0.5 px-2.5 border-slate-100 text-slate-400 bg-slate-50/30 shrink-0"
              >
                {p.stock}
              </Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
