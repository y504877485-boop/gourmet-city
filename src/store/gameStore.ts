import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type Position = [number, number, number];

export interface Item {
  id: string;
  type: 'table' | 'stove';
  x: number;
  y: number;
  rotation: number;
  occupiedBy?: string; // customerId
  food?: 'burger' | 'pizza' | null;
  cookingProgress?: number; // 0-100
  isCooking?: boolean;
}

export interface Customer {
  id: string;
  state: 'walking_in' | 'waiting_for_food' | 'eating' | 'leaving';
  targetPos: Position;
  tableId: string | null;
  progress: number;
}

export interface Staff {
  id: string;
  role: 'chef' | 'waiter';
  state: 'idle' | 'moving' | 'cooking' | 'carrying';
  position: Position;
  targetPos: Position | null;
  targetId?: string; // tableId or stoveId
  holding?: 'burger' | 'pizza' | null;
}

interface GameState {
  money: number;
  level: number;
  items: Item[];
  customers: Customer[];
  staff: Staff[];
  mode: 'play' | 'edit';
  selectedItemType: 'table' | 'stove' | null;
  
  // Actions
  addMoney: (amount: number) => void;
  placeItem: (type: 'table' | 'stove', x: number, y: number) => void;
  setMode: (mode: 'play' | 'edit') => void;
  selectItemType: (type: 'table' | 'stove' | null) => void;
  
  // Simulation Actions
  spawnCustomer: () => void;
  updateCustomerState: (id: string, updates: Partial<Customer>) => void;
  removeCustomer: (id: string) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
}

export const useStore = create<GameState>()(
  persist(
    (set, get) => ({
      money: 2000,
      level: 1,
      items: [
        { id: 't1', type: 'table', x: 2, y: 2, rotation: 0 },
        { id: 't2', type: 'table', x: -2, y: 2, rotation: 0 },
        { id: 's1', type: 'stove', x: 0, y: -2, rotation: 0 }
      ],
      customers: [],
      staff: [
        { id: 'c1', role: 'chef', state: 'idle', position: [0, 0, -3], targetPos: null },
        { id: 'w1', role: 'waiter', state: 'idle', position: [2, 0, -3], targetPos: null }
      ],
      mode: 'play',
      selectedItemType: null,

      addMoney: (amount) => set((state) => ({ money: state.money + amount })),
      
      placeItem: (type, x, y) => {
        const state = get();
        // Check collision
        if (state.items.some(i => Math.round(i.x) === x && Math.round(i.y) === y)) return;
        
        const cost = type === 'table' ? 100 : 300;
        if (state.money < cost) return;

        set((state) => ({
          items: [...state.items, { id: uuidv4(), type, x, y, rotation: 0 }],
          money: state.money - cost,
          mode: 'play',
          selectedItemType: null
        }));
      },

      setMode: (mode) => set({ mode }),
      selectItemType: (type) => set({ selectedItemType: type, mode: 'edit' }),

      spawnCustomer: () => {
        const state = get();
        // Limit max customers based on table count
        if (state.customers.length >= state.items.filter(i => i.type === 'table').length) return;

        // Find empty table
        const tables = state.items.filter(i => i.type === 'table' && !i.occupiedBy);
        if (tables.length === 0) return;
        
        const randomTable = tables[Math.floor(Math.random() * tables.length)];
        const customerId = uuidv4();

        // Mark table occupied
        get().updateItem(randomTable.id, { occupiedBy: customerId });

        set((state) => ({
          customers: [...state.customers, {
            id: customerId,
            state: 'walking_in',
            targetPos: [randomTable.x, 0, randomTable.y],
            tableId: randomTable.id,
            progress: 0
          }]
        }));
      },

      updateCustomerState: (id, updates) => set((state) => ({
        customers: state.customers.map(c => c.id === id ? { ...c, ...updates } : c)
      })),

      removeCustomer: (id) => set((state) => ({
        customers: state.customers.filter(c => c.id !== id)
      })),

      updateItem: (id, updates) => set((state) => ({
        items: state.items.map(i => i.id === id ? { ...i, ...updates } : i)
      })),

      updateStaff: (id, updates) => set((state) => ({
        staff: state.staff.map(s => s.id === id ? { ...s, ...updates } : s)
      }))
    }),
    {
      name: 'gourmet-city-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        money: state.money, 
        items: state.items, 
        // Do not persist transient entities like customers/staff positions to avoid glitches on reload
        // But persistent staff (inventory) should be saved if we had hiring logic. Currently staff is hardcoded.
      }),
    }
  )
);
