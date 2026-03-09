# Zenvix Platform: Frontend Build Documentation

The frontend is a high-performance SPA (Single Page Application) built with React and Vite. It is designed to be "Glassmorphic" and "Premium" in aesthetic, targeting modern SaaS users.

## 1. Technologies

- **React 18**: Component-based UI logic.
- **Vite**: Ultra-fast build tool and dev server.
- **TailwindCSS**: Utility-first styling with custom glassmorphism effects.
- **Shadcn UI**: Accessible, unstyled components customized for Zenvix.
- **React Query (TanStack)**: Server state management and caching.
- **Lucide React**: Unified icon set.

## 2. Directory Structure

- `src/core/`: Foundation logic (API clients, hooks, global state).
- `src/components/`: Reusable primitive components (Button, Input, Modal).
- `src/modules/`: Business-specific features (Inventory, Finance, Retail).
- `src/pages/`: Routing entry points.
- `src/layouts/`: Shell components (Sidebar, Dashboard layout).

## 3. Key Patterns

### Module-Based Architecture

Each business domain (Retail, HR, Finance) is treated as a module. Components, hooks, and services related to that domain are encapsulated within the module folder.

### Command Center (Dashboard)

The main entry point for users is the **Command Center**. It provides:

- **AI Insight Engine**: Predictive analytics and alerts.
- **Resource Heatmap**: Real-time status of locations/devices.
- **Global Activity Feed**: Unified audit trail visualization.

### Responsive Design

The UI is fully responsive, supporting:

- Large Desktop (Manager Views)
- Tablets (POS Interface)
- Mobile (Mobile Staff Tools)

## 4. Multi-Tenant Context

The frontend retrieves the `tenant_id` and `location_id` from the session/context and injects them into every API request via interceptors.
