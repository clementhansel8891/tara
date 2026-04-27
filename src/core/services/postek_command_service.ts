/**
 * Postek Command Service (PPLE)
 * 
 * This service translates UI inputs into raw PPLE (Postek Printer Language Enhanced) strings.
 * Precision is based on 8 dots per mm (203 DPI).
 */

export interface pple_print_item {
  name: string;
  barcode: string;
  price?: number;
  quantity: number;
}

export interface pple_layout_block {
  id: "name" | "barcode" | "price";
  x: number; // mm
  y: number; // mm
  width: number; // mm
  height: number; // mm
}

export interface pple_settings {
  paper_width: number; // mm
  paper_height: number; // mm
  gap_height: number; // mm
  print_speed: number; // 1-6
  print_darkness: number; // 0-20
  barcode_type: string; // e.g., "1" for Code 128
  barcode_density: number; // narrow bar width in dots
  margin_top: number; // mm
  margin_left: number; // mm
}

/**
 * Converts millimeters to dots based on 203 DPI (8 dots/mm)
 */
export const mm_to_dots = (mm: number): number => {
  return Math.round(mm * 8);
};

/**
 * Sets the label size (width and height)
 */
export const set_label_size = (width_mm: number, height_mm: number): string => {
  // PPLE ^W is width in mm, ^Q is height in mm (with gap)
  return `^W${width_mm}\n`;
};

/**
 * Sets the gap size
 */
export const set_gap_size = (height_mm: number, gap_mm: number): string => {
  return `^Q${height_mm},${gap_mm}\n`;
};

/**
 * Generates the full PPLE command string for a set of items
 */
export const generate_pple_command = (
  items: pple_print_item[],
  settings: pple_settings,
  layout: pple_layout_block[]
): string => {
  let command = "";

  // 1. Global Setup
  command += set_label_size(settings.paper_width, settings.paper_height);
  command += set_gap_size(settings.paper_height, settings.gap_height);
  command += `^S${settings.print_speed}\n`;
  command += `^H${settings.print_darkness}\n`;

  // 2. Iterate through items and quantities
  for (const item of items) {
    if (item.quantity <= 0) continue;

    // Start Format
    command += "^L\n";

    // Draw blocks from layout
    for (const block of layout) {
      const x_dots = mm_to_dots(block.x + settings.margin_left);
      const y_dots = mm_to_dots(block.y + settings.margin_top);
      const h_dots = mm_to_dots(block.height);

      if (block.id === "name") {
        // Text: 1 (Fixed), Orientation, Font, HorizMult, VertMult, Reverse, X, Y, Data
        // Simplified PPLB/EPL style: A<x>,<y>,<rot>,<font>,<h>,<v>,<n>,<data>
        // But for Postek PPLE specifically:
        command += `1X11000${x_dots.toString().padStart(4, "0")}${y_dots.toString().padStart(4, "0")}${item.name}\n`;
      } else if (block.id === "barcode") {
        // Barcode: 1 (Fixed), Type (e.g. 9 for 128), Orientation, HorizMult, VertMult, Height, X, Y, Data
        const type = settings.barcode_type || "E"; // E is Code 128 in some PPLE versions
        command += `1${type}11000${h_dots.toString().padStart(3, "0")}${x_dots.toString().padStart(4, "0")}${y_dots.toString().padStart(4, "0")}${item.barcode}\n`;
      } else if (block.id === "price") {
        const price_text = item.price ? `$${item.price.toFixed(2)}` : "";
        command += `1X11000${x_dots.toString().padStart(4, "0")}${y_dots.toString().padStart(4, "0")}${price_text}\n`;
      }
    }

    // Print Quantity and End
    command += `^P${item.quantity}\n`;
    command += "E\n";
  }

  return command;
};
