"use client";

import { ShoppingCart } from "lucide-react";

export type CartFloatingButtonProps = {
  itemCount?: number;
  navigateToPOS: () => void;
  scrollToPay?: () => void;
};

export function CartFloatingButton({ itemCount = 0, navigateToPOS, scrollToPay }: CartFloatingButtonProps) {
  const showBadge = itemCount > 0;

  return (
    <button
      type="button"
      onClick={() => {
        navigateToPOS();
        scrollToPay?.();
      }}
      className="fixed bottom-24 right-6 z-10 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-200 text-white shadow-lg shadow-amber-300/60 ring-2 ring-white/70 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2"
      aria-label="ไปที่หน้าขาย"
    >
      <div className="relative h-10 w-10">
        <ShoppingCart className="h-10 w-10 text-white" strokeWidth={2.25} />
        {showBadge && (
          <span className="absolute -top-2 -right-3 min-w-[26px] rounded-full bg-[#FF3B30] px-1.5 text-center text-xs font-bold text-white shadow-md">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </div>
    </button>
  );
}

export default CartFloatingButton;
