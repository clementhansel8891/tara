import React from "react";
import { ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Marketplace {
  id: string;
  name: string;
  color: string;
  icon: any;
}

interface MarketplaceGalleryProps {
  marketplaces: Marketplace[];
  onSelect: (name: string, type: string, platform: string) => void;
}

export const MarketplaceGallery = ({ marketplaces, onSelect }: MarketplaceGalleryProps) => {
  return (
    <div className="mb-6">
      <div className="text-sm font-black italic tracking-widest text-slate-400 uppercase mb-4">
        Connect Marketplace
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {marketplaces.map((mp) => (
          <Card
            key={mp.id}
            onClick={() => onSelect(mp.name, "MARKETPLACE", mp.id)}
            className="border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all group rounded-2xl"
          >
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
              <div
                className={`w-12 h-12 bg-${mp.color}-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
              >
                <mp.icon className={`w-6 h-6 text-${mp.color}-600`} />
              </div>
              <div className="font-black italic text-slate-700 text-sm group-hover:text-blue-700">
                {mp.name}
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                Ready to Connect
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
