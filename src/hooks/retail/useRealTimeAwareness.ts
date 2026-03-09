import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export const useRealTimeAwareness = (onEvent: (event: any) => void) => {
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      const events = [
        {
          type: "ORDER_CREATED",
          data: {
            id: "ORD-" + Math.floor(Math.random() * 1000),
            amount: 150000,
          },
        },
        {
          type: "DEVICE_OFFLINE",
          data: { id: "DEV-004", name: "Kitchen Printer" },
        },
        { type: "SHIFT_OPENED", data: { staff: "Charlie" } },
        {
          type: "INVENTORY_CRITICAL",
          data: { sku: "SKU-991", name: "Milk 1L" },
        },
      ];

      // Simulate a 10% chance of an event every 10 seconds
      if (Math.random() < 0.1) {
        const event = events[Math.floor(Math.random() * events.length)];

        toast({
          title: `Real-Time Alert: ${event.type}`,
          description: JSON.stringify(event.data),
          variant:
            event.type === "INVENTORY_CRITICAL" ||
            event.type === "DEVICE_OFFLINE"
              ? "destructive"
              : "default",
        });

        onEvent(event);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [onEvent, toast]);
};
