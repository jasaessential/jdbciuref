
"use client";

import { AuthProvider } from "@/context/auth-provider";
import { CartProvider } from "@/context/cart-provider";
import { LoadingProvider } from "@/context/loading-provider";
import { LocationProvider } from "@/context/location-provider";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <LoadingProvider>
          <LocationProvider>
            {children}
          </LocationProvider>
        </LoadingProvider>
      </CartProvider>
    </AuthProvider>
  );
}
