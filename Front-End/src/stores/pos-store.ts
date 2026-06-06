import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
  type: string;
  batch?: string;
};

export type PosState = {
  cart: CartItem[];
  draftCarts: { id: string; name: string; timestamp: number; items: CartItem[] }[];
  addItem: (item: CartItem) => void;
  updateQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  holdCart: (name: string) => void;
  restoreCart: (id: string) => void;
  removeDraft: (id: string) => void;
};

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      cart: [],
      draftCarts: [],
      
      addItem: (item) => set((state) => {
        const existing = state.cart.find(i => i.id === item.id);
        if (existing) {
          return { cart: state.cart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) };
        }
        return { cart: [...state.cart, { ...item, qty: 1 }] };
      }),
      
      updateQty: (id, qty) => set((state) => ({
        cart: state.cart.map(i => i.id === id ? { ...i, qty: Math.max(1, qty) } : i)
      })),
      
      removeItem: (id) => set((state) => ({
        cart: state.cart.filter(i => i.id !== id)
      })),
      
      clearCart: () => set({ cart: [] }),
      
      holdCart: (name) => set((state) => {
        if (state.cart.length === 0) return state;
        const newDraft = {
          id: Math.random().toString(36).substr(2, 9),
          name: name || `Draft ${new Date().toLocaleTimeString()}`,
          timestamp: Date.now(),
          items: [...state.cart]
        };
        return { 
          draftCarts: [...state.draftCarts, newDraft],
          cart: []
        };
      }),
      
      restoreCart: (id) => set((state) => {
        const draft = state.draftCarts.find(d => d.id === id);
        if (!draft) return state;
        
        // If current cart has items, we should ideally hold them first, but for simplicity we replace
        return {
          cart: [...draft.items],
          draftCarts: state.draftCarts.filter(d => d.id !== id)
        };
      }),
      
      removeDraft: (id) => set((state) => ({
        draftCarts: state.draftCarts.filter(d => d.id !== id)
      }))
    }),
    {
      name: 'pos-storage',
    }
  )
);
