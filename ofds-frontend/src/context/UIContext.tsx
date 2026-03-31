import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";

// ── State ──

interface UIState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
}

// ── Actions ──

type UIAction =
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SIDEBAR_MOBILE"; payload: boolean };

// ── Reducer ──

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case "SET_SIDEBAR_MOBILE":
      return { ...state, sidebarMobileOpen: action.payload };
    default:
      return state;
  }
}

// ── Context Type ──

interface UIContextValue extends UIState {
  toggleSidebar: () => void;
  setSidebarMobileOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

// ── Provider ──

export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, {
    sidebarCollapsed: false,
    sidebarMobileOpen: false,
  });

  const toggleSidebar = useCallback(() => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  }, []);

  const setSidebarMobileOpen = useCallback((open: boolean) => {
    dispatch({ type: "SET_SIDEBAR_MOBILE", payload: open });
  }, []);

  return (
    <UIContext.Provider
      value={{ ...state, toggleSidebar, setSidebarMobileOpen }}
    >
      {children}
    </UIContext.Provider>
  );
}

// ── Hook ──

export function useUI(): UIContextValue {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}
