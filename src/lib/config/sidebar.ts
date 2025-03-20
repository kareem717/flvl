import {
  Banknote,
  Check,
  Landmark,
  LayoutGrid,
  LogOut,
  Plug,
} from "lucide-react";
import { redirects } from "./redirects";
import type { ElementType } from "react";

export type NavigationItem =
  | {
      title: string;
      url: string;
      icon?: ElementType;
    }
  | {
      title: string;
      root: string;
      icon?: ElementType;
      items: {
        title: string;
        url: string;
      }[];
    };

export type NavigationMenu = {
  name: string;
  path: string;
  items: NavigationItem[];
};

/**
 * An array of navigation items for the dashboard sidebar.
 */
const dashboard: NavigationMenu[] = [
  {
    name: "Linked Accounts",
    path: redirects.app.root,
    items: [
      {
        title: "View All",
        url: redirects.app.root,
      },
    ],
  },
  {
    name: "Account",
    path: redirects.app.root,
    items: [
      {
        title: "Logout",
        url: redirects.auth.logout,
        icon: LogOut,
      },
    ],
  },
];

const companyDashboard = (id: number): NavigationMenu[] => [
  {
    name: "Company",
    path: redirects.app.company(id).root,
    items: [
      {
        title: "Overview",
        url: redirects.app.company(id).root,
        icon: LayoutGrid,
      },
    ],
  },
  {
    name: "Bank Accounts",
    path: redirects.app.company(id).root,
    items: [
      {
        title: "View All",
        url: redirects.app.company(id).bank.root,
        icon: Landmark,
      },
      {
        title: "Reconcile",
        url: redirects.app.company(id).bank.reconciliation,
        icon: Check,
      },
    ],
  },
  {
    name: "Settings",
    path: redirects.app.company(id).settings.root,
    items: [
      {
        title: "Connections",
        url: redirects.app.company(id).settings.connections,
        icon: Plug,
      },
    ],
  },
];

/**
 * A configuration object for sidebar navigation items.
 */
export const sidebar = {
  dashboard,
  companyDashboard,
};
