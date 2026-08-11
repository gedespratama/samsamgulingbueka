import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { OrderType, PaymentMethodKey } from '../data/mock';

export interface CartAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  key: string;
  menuId: string;
  name: string;
  qty: number;
  unitPrice: number;
  variant: string | null;
  addons: CartAddon[];
  note: string;
}

export interface PaidOrder {
  total: number;
  method: PaymentMethodKey;
  orderType: OrderType;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  orderType: OrderType;
  tableNumber: string;
  setOrderType: (type: OrderType) => void;
  setTableNumber: (number: string) => void;
  addItem: (key: string, item: Omit<CartItem, 'key'>) => void;
  updateQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  setPaidOrder: (order: PaidOrder | null) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [tableNumber, setTableNumber] = useState('');
  const [paidOrder, setPaidOrder] = useState<PaidOrder | null>(null);

  const addItem = (key: string, item: Omit<CartItem, 'key'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + item.qty } : i));
      }
      return [...prev, { ...item, key }];
    });
  };

  const updateQty = (key: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, qty: Math.max(1, qty) } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const clearCart = () => {
    setItems([]);
    setOrderType('dine_in');
    setTableNumber('');
  };

  const value = useMemo(
    () => ({
      items,
      totalItems: items.reduce((sum, i) => sum + i.qty, 0),
      subtotal: items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0),
      orderType,
      tableNumber,
      setOrderType,
      setTableNumber,
      addItem,
      updateQty,
      removeItem,
      clearCart,
      paidOrder,
      setPaidOrder,
    }),
    [items, orderType, tableNumber, paidOrder]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart harus dipakai di dalam CartProvider');
  }
  return ctx;
}
