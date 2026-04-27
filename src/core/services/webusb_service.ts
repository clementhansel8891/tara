/**
 * WebUSB Service for Direct Printer Communication
 * 
 * Bypasses the browser print dialog and local bridges.
 */

export interface usb_device_info {
  vendor_id: number;
  product_id: number;
  manufacturer_name?: string;
  product_name?: string;
}

let active_device: USBDevice | null = null;

/**
 * Requests the user to select a USB device (Postek Printer)
 */
export const connect_printer = async (): Promise<usb_device_info> => {
  try {
    const device = await navigator.usb.requestDevice({
      filters: [] // Allow all devices to be selected by the user
    });

    active_device = device;
    await device.open();
    
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    
    await device.claimInterface(0);

    return {
      vendor_id: device.vendorId,
      product_id: device.productId,
      manufacturer_name: device.manufacturerName,
      product_name: device.productName,
    };
  } catch (error) {
    console.error("WebUSB Connection Error:", error);
    throw error;
  }
};

/**
 * Sends raw string data to the connected USB device
 */
export const send_raw_data = async (data: string): Promise<void> => {
  if (!active_device) {
    throw new Error("No printer connected via WebUSB.");
  }

  const encoder = new TextEncoder();
  const raw_bytes = encoder.encode(data);

  // Find the first OUT endpoint
  const interface_index = 0;
  const out_endpoint = active_device.configuration?.interfaces[interface_index]
    .alternate.endpoints.find(e => e.direction === "out");

  if (!out_endpoint) {
    throw new Error("No output endpoint found on the USB device.");
  }

  try {
    const result = await active_device.transferOut(out_endpoint.endpointNumber, raw_bytes);
    if (result.status !== "ok") {
      throw new Error(`USB Transfer failed: ${result.status}`);
    }
  } catch (error) {
    console.error("WebUSB Transfer Error:", error);
    throw error;
  }
};

/**
 * Checks if a printer is currently connected
 */
export const is_printer_connected = (): boolean => {
  return active_device !== null && active_device.opened;
};
