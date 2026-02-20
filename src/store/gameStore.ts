import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Simple ID generator to avoid external dependencies
const generateId = () => Math.random().toString(36).substr(2, 9);

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
      money: 50000, // Rich start
      level: 10,
      items: [
        // Kitchen Area
        { id: 's1', type: 'stove', x: -4, y: -4, rotation: 0 },
        { id: 's2', type: 'stove', x: -2, y: -4, rotation: 0 },
        { id: 's3', type: 'stove', x: 0, y: -4, rotation: 0 },
        { id: 's4', type: 'stove', x: 2, y: -4, rotation: 0 },
        { id: 's5', type: 'stove', x: 4, y: -4, rotation: 0 },
        
        // Dining Area - Row 1
        { id: 't1', type: 'table', x: -4, y: 0, rotation: 0 },
        { id: 't2', type: 'table', x: -2, y: 0, rotation: 0 },
        { id: 't3', type: 'table', x: 0, y: 0, rotation: 0 },
        { id: 't4', type: 'table', x: 2, y: 0, rotation: 0 },
        { id: 't5', type: 'table', x: 4, y: 0, rotation: 0 },

        // Dining Area - Row 2
        { id: 't6', type: 'table', x: -4, y: 3, rotation: 0 },
        { id: 't7', type: 'table', x: -2, y: 3, rotation: 0 },
        { id: 't8', type: 'table', x: 0, y: 3, rotation: 0 },
        { id: 't9', type: 'table', x: 2, y: 3, rotation: 0 },
        { id: 't10', type: 'table', x: 4, y: 3, rotation: 0 },
      ],
      customers: [],
      staff: [
        // Chefs Army
        { id: 'c1', role: 'chef', state: 'idle', position: [-4, 0, -6], targetPos: null },
        { id: 'c2', role: 'chef', state: 'idle', position: [-2, 0, -6], targetPos: null },
        { id: 'c3', role: 'chef', state: 'idle', position: [0, 0, -6], targetPos: null },
        { id: 'c4', role: 'chef', state: 'idle', position: [2, 0, -6], targetPos: null },
        { id: 'c5', role: 'chef', state: 'idle', position: [4, 0, -6], targetPos: null },

        // Waiters Army
        { id: 'w1', role: 'waiter', state: 'idle', position: [-4, 0, 6], targetPos: null },
        { id: 'w2', role: 'waiter', state: 'idle', position: [-2, 0, 6], targetPos: null },
        { id: 'w3', role: 'waiter', state: 'idle', position: [0, 0, 6], targetPos: null },
        { id: 'w4', role: 'waiter', state: 'idle', position: [2, 0, 6], targetPos: null },
        { id: 'w5', role: 'waiter', state: 'idle', position: [4, 0, 6], targetPos: null },
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
          items: [...state.items, { id: generateId(), type, x, y, rotation: 0 }],
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
        const customerId = generateId();

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
      }),
    }
  )
);
