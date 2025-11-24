"use client";

import Image from "next/image";
import cartIcon from "../../assets/ui/cart/pos_cart_green_circle.png";

export type CartFloatingButtonProps = {
  itemCount?: number;
  navigateToPOS: () => void;
};

export function CartFloatingButton({ itemCount = 0, navigateToPOS }: CartFloatingButtonProps) {
  const showBadge = itemCount > 0;

  return (
    <button
      type="button"
      onClick={navigateToPOS}
      className="fixed bottom-6 right-6 z-50 inline-flex h-16 w-16 items-center justify-center rounded-full bg-transparent shadow-lg shadow-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2"
      aria-label="ไปที่หน้าขาย"
    >
      <div className="relative h-16 w-16">
        <Image src={cartIcon} alt="Cart" fill className="object-contain" priority />
        {showBadge && (
          <span className="absolute -top-1 -right-1 min-w-[26px] rounded-full bg-[#FF3B30] px-1.5 text-center text-xs font-bold text-white shadow-md">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </div>
    </button>
  );
}

export default CartFloatingButton;
