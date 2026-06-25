import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

export function Toaster() {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme}
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "bg-card border-border shadow-luxury-md",
          title: "text-foreground text-sm font-medium",
          description: "text-muted-foreground text-xs",
        },
      }}
    />
  );
}
