import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DragEndEvent } from "@dnd-kit/core";
import { BlockPosition } from "./PostekEngine";
import {
  generate_pple_command,
  pple_settings,
  pple_print_item,
} from "@/core/services/postek_command_service";
import {
  connect_printer,
  send_raw_data,
  is_printer_connected,
} from "@/core/services/webusb_service";

import {
  PREVIEW_SCALE,
  PAPER_PRESETS,
  defaultLayout,
  DEFAULT_BARCODE_TYPE,
  DEFAULT_BARCODE_DENSITY,
} from "./postek/PostekConstants";
import { PostekLeftControls } from "./postek/PostekLeftControls";
import { PostekPreviewPane } from "./postek/PostekPreviewPane";

export interface PrintItem {
  id: string;
  sku: string;
  name: string;
  barcode: string;
  price?: number;
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
  items: PrintItem[];
}

export const PostekPrintModal: React.FC<DialogProps> = ({
  open,
  onClose,
  items,
}) => {
  const { toast } = useToast();

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [paperPreset, setPaperPreset] = useState<string>("50x30");
  const [paperWidth, setPaperWidth] = useState(50);
  const [paperHeight, setPaperHeight] = useState(30);
  const [columns, setColumns] = useState(1);
  const [stickerWidth, setStickerWidth] = useState(50);
  const [horizontalGap, setHorizontalGap] = useState(0);
  const [layout, setLayout] = useState<BlockPosition[]>(defaultLayout);

  const [dpi, setDpi] = useState<203 | 300>(203);
  const [gap, setGap] = useState(2);
  const [density, setDensity] = useState(10); // Darkness 0-20
  const [speed, setSpeed] = useState(4); // 1-6
  const [marginTop, setMarginTop] = useState(0);
  const [marginLeft, setMarginLeft] = useState(0);

  const [barcodeType, setBarcodeType] = useState(DEFAULT_BARCODE_TYPE);
  const [barcodeDensity, setBarcodeDensity] = useState(DEFAULT_BARCODE_DENSITY);
  const [isConnected, setIsConnected] = useState(false);

  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (open && items.length > 0) {
      setQuantities((prev) => {
        const next: Record<string, number> = {};
        items.forEach((item) => {
          next[item.id] = prev[item.id] || 1;
        });
        return next;
      });
      setIsConnected(is_printer_connected());
    }
  }, [open, items]);

  const totalLabels = Object.values(quantities).reduce((a, b) => a + b, 0);

  const handleUpdateQty = (id: string, val: string) => {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setQuantities((prev) => ({ ...prev, [id]: parsed }));
    } else if (val === "") {
      setQuantities((prev) => ({ ...prev, [id]: 0 }));
    }
  };

  const handleConnect = async () => {
    try {
      const info = await connect_printer();
      setIsConnected(true);
      toast({
        title: "Printer Connected",
        description: `Connected to ${info.product_name || "Postek Printer"}.`,
      });
    } catch (err) {
      toast({
        title: "Connection Failed",
        description: "Could not establish WebUSB link.",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    if (!active) return;

    setLayout((prevLayout) =>
      (Array.isArray(prevLayout) ? prevLayout : []).map((block) => {
        if (block.id === active.id) {
          const deltaXmm = delta.x / PREVIEW_SCALE;
          const deltaYmm = delta.y / PREVIEW_SCALE;

          let newX = Math.round(block.x + deltaXmm);
          let newY = Math.round(block.y + deltaYmm);

          const currentColWidth =
            columns > 1 ? paperWidth / columns : paperWidth;

          // Constraints ensure printing won't fall off the specific die-cut sticker
          newX = Math.max(
            -marginLeft,
            Math.min(newX, currentColWidth - block.width - marginLeft),
          );
          newY = Math.max(
            -marginTop,
            Math.min(newY, paperHeight - block.height - marginTop),
          );

          return { ...block, x: newX, y: newY };
        }
        return block;
      }),
    );
  };

  const handlePrint = async () => {
    if (totalLabels === 0) return;
    setIsPrinting(true);

    try {
      // Prepare items with their specific quantities
      const ppleItems: pple_print_item[] = (Array.isArray(items) ? items : []).map((item) => ({
          name: item.name,
          barcode: item.barcode,
          price: item.price,
          quantity: quantities[item.id] || 0,
        }))
        .filter((i) => i.quantity > 0);

      const ppleSettings: pple_settings = {
        paper_width: paperWidth,
        paper_height: paperHeight,
        gap_height: gap,
        print_speed: speed,
        print_darkness: density,
        barcode_type: barcodeType,
        barcode_density: barcodeDensity,
        margin_top: marginTop,
        margin_left: marginLeft,
      };

      const ppleLayout = (Array.isArray(layout) ? layout : []).map((l) => ({
        id: l.id,
        x: l.x,
        y: l.y,
        width: l.width,
        height: l.height,
      }));

      const command = generate_pple_command(ppleItems, ppleSettings, ppleLayout);

      console.log("--- PPLE OUTPUT ---");
      console.log(command);
      console.log("-------------------");

      if (isConnected) {
        await send_raw_data(command);
        toast({
          title: "Sent to Postek Printer",
          description: `Directly transmitted ${totalLabels} labels via WebUSB.`,
        });
      } else {
        // Fallback or warning if not connected
        toast({
          title: "Not Connected",
          description: "Please click CONNECT before printing.",
          variant: "destructive",
        });
        setIsPrinting(false);
        return;
      }

      onClose();
    } catch (err) {
      toast({
        title: "Print Failed",
        description:
          err instanceof Error ? err.message : "Internal transmission error.",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-6xl rounded-[2rem] p-0 overflow-hidden bg-slate-50 flex h-[85vh] border-none shadow-2xl">
        <PostekLeftControls
          items={items}
          quantities={quantities}
          handleUpdateQty={handleUpdateQty}
          paperPreset={paperPreset}
          setPaperPreset={setPaperPreset}
          paperWidth={paperWidth}
          setPaperWidth={setPaperWidth}
          paperHeight={paperHeight}
          setPaperHeight={setPaperHeight}
          columns={columns}
          setColumns={setColumns}
          stickerWidth={stickerWidth}
          setStickerWidth={setStickerWidth}
          horizontalGap={horizontalGap}
          setHorizontalGap={setHorizontalGap}
          dpi={dpi}
          setDpi={setDpi}
          gap={gap}
          setGap={setGap}
          density={density}
          setDensity={setDensity}
          speed={speed}
          setSpeed={setSpeed}
          marginTop={marginTop}
          setMarginTop={setMarginTop}
          marginLeft={marginLeft}
          setMarginLeft={setMarginLeft}
          barcodeType={barcodeType}
          setBarcodeType={setBarcodeType}
          barcodeDensity={barcodeDensity}
          setBarcodeDensity={setBarcodeDensity}
          isConnected={isConnected}
          handleConnect={handleConnect}
          totalLabels={totalLabels}
          isPrinting={isPrinting}
          handlePrint={handlePrint}
        />

        <PostekPreviewPane
          paperWidth={paperWidth}
          paperHeight={paperHeight}
          columns={columns}
          gap={gap}
          horizontalGap={horizontalGap}
          stickerWidth={stickerWidth}
          marginTop={marginTop}
          marginLeft={marginLeft}
          layout={layout}
          handleDragEnd={handleDragEnd}
          items={items}
        />
      </DialogContent>
    </Dialog>
  );
};
