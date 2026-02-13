import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerDefaultRepos } from "@/core/persistence/repositoryRegistry";
import { startFinanceBackgroundScheduler } from "@/core/services/finance/financeScheduler";

registerDefaultRepos();
startFinanceBackgroundScheduler();

createRoot(document.getElementById("root")!).render(<App />);
