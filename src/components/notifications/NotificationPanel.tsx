"use client";

import { useNotificationStore } from "@/store/notification-store";
import { Bell, BellOff, X, AlertTriangle, Info, Clock } from "lucide-react";

export default function NotificationPanel() {
  const { notifications, markAsRead, markAllAsRead, removeNotification, clearAll } =
    useNotificationStore();

  const getIcon = (type: string) => {
    switch (type) {
      case "overdue":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="notification-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="font-semibold text-sm text-slate-800">Notifikasi</h3>
        <div className="flex gap-2">
          {notifications.length > 0 && (
            <>
              <button
                onClick={markAllAsRead}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Tandai semua dibaca
              </button>
              <button
                onClick={clearAll}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Hapus semua
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notifications list */}
      <div className="overflow-y-auto max-h-[380px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <BellOff className="w-10 h-10 mb-2" />
            <p className="text-sm">Tidak ada notifikasi</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${
                !notification.read ? "bg-red-50/50" : ""
              }`}
            >
              <div className="mt-0.5">{getIcon(notification.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 leading-snug">
                  {notification.message}
                </p>
                <p className="text-[0.65rem] text-slate-400 mt-1">
                  {new Date(notification.createdAt).toLocaleString("id-ID")}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                }}
                className="text-slate-300 hover:text-slate-500 mt-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
