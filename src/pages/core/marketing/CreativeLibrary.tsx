import React, { useState } from "react";
import { 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Download,
  Trash2,
  ExternalLink,
  Tag,
  FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const MOCK_ASSETS = [
  { id: "1", name: "Summer Campaign Hero", type: "IMAGE", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=400", tags: ["Summer", "Banner"], date: "2024-03-20" },
  { id: "2", name: "Brand Intro Video", type: "VIDEO", url: "https://api.zenvix.ai/placeholder-video.mp4", tags: ["Brand", "Social"], date: "2024-03-18" },
  { id: "3", name: "Lead Magnet Template", type: "DOCUMENT", url: "#", tags: ["Lead Gen", "PDF"], date: "2024-03-15" },
  { id: "4", name: "Facebook Ad V1", type: "IMAGE", url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=400", tags: ["Ads", "Facebook"], date: "2024-03-12" },
  { id: "5", name: "Product Showcase", type: "IMAGE", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400", tags: ["Catalog", "HQ"], date: "2024-03-10" },
  { id: "6", name: "Q1 Sales Deck", type: "DOCUMENT", url: "#", tags: ["Sales", "Internal"], date: "2024-03-05" },
];

export default function CreativeLibrary() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");

  const filteredAssets = MOCK_ASSETS.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creative Asset Library</h1>
          <p className="text-slate-500 mt-1">Manage all your marketing media, templates, and ad creatives in one place.</p>
        </div>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Upload New Asset
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search assets by name or tag..." 
            className="pl-10 bg-slate-50 dark:bg-slate-800 border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
          <div className="flex border rounded-lg overflow-hidden">
            <Button 
              variant={view === "grid" ? "secondary" : "ghost"} 
              size="sm" 
              className="rounded-none px-3"
              onClick={() => setView("grid")}
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
            <Button 
              variant={view === "list" ? "secondary" : "ghost"} 
              size="sm" 
              className="rounded-none px-3"
              onClick={() => setView("list")}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAssets.map((asset) => (
          <Card key={asset.id} className="group overflow-hidden border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-all duration-300 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="aspect-video relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                {asset.type === "IMAGE" ? (
                  <img src={asset.url} alt={asset.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                ) : asset.type === "VIDEO" ? (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Video className="h-10 w-10" />
                    <span className="text-[10px] font-mono uppercase tracking-widest">Video Content</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <FileText className="h-10 w-10" />
                    <span className="text-[10px] font-mono uppercase tracking-widest">Document</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-[10px] py-0 h-5">
                    {asset.type}
                  </Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 flex flex-col items-start gap-3">
              <div className="flex justify-between items-start w-full">
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm leading-tight group-hover:text-indigo-600 transition-colors">{asset.name}</h3>
                  <p className="text-[10px] text-slate-500">Uploaded {asset.date}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                      <MoreVertical className="h-4 w-4 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2"><Download className="h-4 w-4" /> Download</DropdownMenuItem>
                    <DropdownMenuItem className="gap-2"><Tag className="h-4 w-4" /> Edit Tags</DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-red-600"><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-wrap gap-1">
                {asset.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-[9px] py-0 h-4 border-slate-200 dark:border-slate-700">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardFooter>
          </Card>
        ))}

        <Card className="border-2 border-dashed border-slate-200 dark:border-slate-700 bg-transparent flex flex-col items-center justify-center min-h-[240px] gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
            <Plus className="h-6 w-6 text-slate-400 group-hover:text-indigo-600" />
          </div>
          <p className="text-sm font-medium text-slate-500 group-hover:text-indigo-600">Add New Creative</p>
        </Card>
      </div>
    </div>
  );
}
