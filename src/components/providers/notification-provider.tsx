"use client";

import { ReactNode, useState } from "react";
import { createContext, useContext } from "react";

export const NOTIFICATION_ID_ENUM = {
  IDENTITY_NOT_VERIFIED: "identity-not-verified",
  STRIPE_ACCOUNT_NOT_CONNECTED: "stripe-account-not-connected",
} as const;

export type NOTIFICATION_ID =
  (typeof NOTIFICATION_ID_ENUM)[keyof typeof NOTIFICATION_ID_ENUM];

export interface Notification {
  id: NOTIFICATION_ID;
  title: string;
  description?: string;
  action?: ReactNode;
}

export interface NotificationProviderProps {
  notifications: Notification[];
  getNotification: (id: NOTIFICATION_ID) => Notification | undefined;
  addNotifications: (notifications: Notification[]) => void;
  removeNotification: (id: NOTIFICATION_ID) => void;
}

const NotificationContext = createContext<
  NotificationProviderProps | undefined
>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);

  return context;
};

export function NotificationProvider({
  children,
  notifications: initialNotifications,
}: { children: ReactNode; notifications?: Notification[] }) {
  const [notifications, setNotifications] = useState<Notification[]>(
    initialNotifications || [],
  );

  const getNotification = (id: NOTIFICATION_ID) => {
    return notifications.find((notification) => notification.id === id);
  };

  const addNotifications = (newNotifications: Notification[]) => {
    // handle duplicates
    const uniqueNotifications = newNotifications.filter(
      (notification) => !notifications.some((n) => n.id === notification.id),
    );

    setNotifications(notifications.concat(uniqueNotifications));
  };

  const removeNotification = (id: NOTIFICATION_ID) => {
    setNotifications(
      notifications.filter((notification) => notification.id !== id),
    );
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        getNotification,
        addNotifications,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
