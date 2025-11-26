"use client";

import { PackageCheck } from "lucide-react";

export type DeliveryFloatingButtonProps = {
  pendingDeliveries?: number;
  navigateToQueue: () => void;
};

export function DeliveryFloatingButton({ pendingDeliveries = 0, navigateToQueue }: DeliveryFloatingButtonProps) {
  const showBadge = pendingDeliveries > 0;

  return (
    <button
      type="button"
      onClick={navigateToQueue}
      className="fixed bottom-6 right-6 z-10 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-200 text-white shadow-lg shadow-emerald-300/60 ring-2 ring-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2"
      aria-label="ไปที่คิวส่งมอบ"
    >
      <div className="relative h-10 w-10">
        <PackageCheck className="h-10 w-10 text-white" strokeWidth={2.25} />
        {showBadge && (
          <span className="absolute -top-2 -right-3 min-w-[26px] rounded-full bg-[#FF3B30] px-1.5 text-center text-xs font-bold text-white shadow-md">
            {pendingDeliveries > 99 ? "99+" : pendingDeliveries}
          </span>
        )}
      </div>
    </button>
  );
}

export default DeliveryFloatingButton;
