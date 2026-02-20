import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { Guest, Table, VenueSettings, AppView, MealPreference, RSVPStatus, GuestSide, TableShape } from '../types';

interface AppState {
  // Navigation
  view: AppView;
  setView: (view: AppView) => void;

  // Guests
  guests: Guest[];
  addGuest: (guest: Omit<Guest, 'id' | 'tableId' | 'seatIndex'>) => string;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  removeGuest: (id: string) => void;
  bulkAddFamily: (familyName: string, side: GuestSide, members: { firstName: string; lastName: string; meal: MealPreference }[]) => void;
  importGuestsCSV: (csv: string) => void;

  // Tables
  tables: Table[];
  addTable: (shape: TableShape, seats: number) => string;
  updateTable: (id: string, updates: Partial<Table>) => void;
  removeTable: (id: string) => void;

  // Seating
  assignSeat: (guestId: string, tableId: string, seatIndex: number) => void;
  unassignGuest: (guestId: string) => void;
  unassignTable: (tableId: string) => void;
  autoSeatFamily: (familyId: string, tableId: string) => void;

  // Venue
  venue: VenueSettings;
  updateVenue: (updates: Partial<VenueSettings>) => void;

  // Data management
  exportData: () => string;
  importData: (json: string) => boolean;
  clearAll: () => void;
}

const defaultVenue: VenueSettings = {
  name: 'Our Wedding Venue',
  width: 1200,
  height: 800,
};

let tableCounter = 1;

// Sync data to Firestore (debounced)
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let ignoreNextSnapshot = false;

function syncToFirestore(state: { guests: Guest[]; tables: Table[]; venue: VenueSettings }) {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      ignoreNextSnapshot = true;
      await setDoc(doc(db, 'seating-charts', 'default'), {
        guests: state.guests,
        tables: state.tables,
        venue: state.venue,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Firestore sync failed:', err);
    }
  }, 500);
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      view: 'guests',
      setView: (view) => set({ view }),

      // Guests
      guests: [],

      addGuest: (guest) => {
        const id = uuid();
        set((s) => {
          const newState = {
            guests: [...s.guests, { ...guest, id, tableId: null, seatIndex: null }],
          };
          syncToFirestore({ ...s, ...newState });
          return newState;
        });
        return id;
      },

      updateGuest: (id, updates) =>
        set((s) => {
          const newState = {
            guests: s.guests.map((g) => (g.id === id ? { ...g, ...updates } : g)),
          };
          syncToFirestore({ ...s, ...newState });
          return newState;
        }),

      removeGuest: (id) =>
        set((s) => {
          const newState = {
            guests: s.guests.filter((g) => g.id !== id),
          };
          syncToFirestore({ ...s, ...newState });
          return newState;
        }),

      bulkAddFamily: (familyName, side, members) => {
        const familyId = uuid();
        const newGuests: Guest[] = members.map((m) => ({
          id: uuid(),
          firstName: m.firstName,
          lastName: m.lastName,
          familyId,
          familyName,
          side,
          meal: m.meal,
          rsvp: 'pending' as RSVPStatus,
          notes: '',
          tableId: null,
          seatIndex: null,
        }));
        set((s) => {
          const newState = { guests: [...s.guests, ...newGuests] };
          syncToFirestore({ ...s, ...newState });
          return newState;
        });
      },

      importGuestsCSV: (csv) => {
        const lines = csv.trim().split('\n');
        if (lines.length < 2) return;

        const headers = lines[0].toLowerCase().split(',').map((h) => h.trim());
        const firstIdx = headers.indexOf('first name') !== -1 ? headers.indexOf('first name') : headers.indexOf('firstname');
        const lastIdx = headers.indexOf('last name') !== -1 ? headers.indexOf('last name') : headers.indexOf('lastname');
        const familyIdx = headers.indexOf('family') !== -1 ? headers.indexOf('family') : headers.indexOf('familyname');
        const sideIdx = headers.indexOf('side');
        const mealIdx = headers.indexOf('meal');
        const rsvpIdx = headers.indexOf('rsvp');

        if (firstIdx === -1 || lastIdx === -1) return;

        const familyMap = new Map<string, string>();
        const newGuests: Guest[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim());
          if (!cols[firstIdx] || !cols[lastIdx]) continue;

          const rawFamily = familyIdx !== -1 && cols[familyIdx] ? cols[familyIdx] : cols[lastIdx];
          if (!familyMap.has(rawFamily)) {
            familyMap.set(rawFamily, uuid());
          }

          const side = sideIdx !== -1 ? (cols[sideIdx] as GuestSide) || 'mutual' : 'mutual';
          const meal = mealIdx !== -1 ? (cols[mealIdx] as MealPreference) || 'standard' : 'standard';
          const rsvp = rsvpIdx !== -1 ? (cols[rsvpIdx] as RSVPStatus) || 'pending' : 'pending';

          newGuests.push({
            id: uuid(),
            firstName: cols[firstIdx],
            lastName: cols[lastIdx],
            familyId: familyMap.get(rawFamily)!,
            familyName: rawFamily,
            side: ['bride', 'groom', 'mutual'].includes(side) ? side : 'mutual',
            meal: ['standard', 'vegetarian', 'vegan', 'kosher', 'halal', 'gluten-free', 'kids', 'other'].includes(meal) ? meal : 'standard',
            rsvp: ['pending', 'accepted', 'declined'].includes(rsvp) ? rsvp : 'pending',
            notes: '',
            tableId: null,
            seatIndex: null,
          });
        }

        set((s) => {
          const newState = { guests: [...s.guests, ...newGuests] };
          syncToFirestore({ ...s, ...newState });
          return newState;
        });
      },

      // Tables
      tables: [],

      addTable: (shape, seats) => {
        const id = uuid();
        const existingNames = get().tables.map((t) => t.name);
        let name = `Table ${tableCounter}`;
        while (existingNames.includes(name)) {
          tableCounter++;
          name = `Table ${tableCounter}`;
        }
        tableCounter++;

        set((s) => {
          const newState = {
            tables: [
              ...s.tables,
              {
                id,
                name,
                shape,
                seats,
                x: 100 + Math.random() * 400,
                y: 100 + Math.random() * 300,
                rotation: 0,
              },
            ],
          };
          syncToFirestore({ ...s, ...newState });
          return newState;
        });
        return id;
      },

      updateTable: (id, updates) =>
        set((s) => {
          const newState = {
            tables: s.tables.map((t) => (t.id === id ? { ...t, ...updates } : t)),
          };
          syncToFirestore({ ...s, ...newState });
          return newState;
        }),

      removeTable: (id) => {
        set((s) => {
          const newState = {
            tables: s.tables.filter((t) => t.id !== id),
            guests: s.guests.map((g) =>
              g.tableId === id ? { ...g, tableId: null, seatIndex: null } : g
            ),
          };
          syncToFirestore({ ...s, ...newState });
          return newState;
        });
      },

      // Seating
      assignSeat: (guestId, tableId, seatIndex) => {
        set((s) => {
          const newState = {
            guests: s.guests.map((g) => {
              if (g.tableId === tableId && g.seatIndex === seatIndex && g.id !== guestId) {
                return { ...g, tableId: null, seatIndex: null };
              }
              if (g.id === guestId) {
                return { ...g, tableId, seatIndex };
              }
              return g;
            }),
          };
          syncToFirestore({ ...s, ...newState });
          return newState;
        });
      },

      unassignGuest: (guestId) =>
        set((s) => {
          const newState = {
            guests: s.guests.map((g) =>
              g.id === guestId ? { ...g, tableId: null, seatIndex: null } : g
            ),
          };
          syncToFirestore({ ...s, ...newState });
          return newState;
        }),

      unassignTable: (tableId) =>
        set((s) => {
          const newState = {
            guests: s.guests.map((g) =>
              g.tableId === tableId ? { ...g, tableId: null, seatIndex: null } : g
            ),
          };
          syncToFirestore({ ...s, ...newState });
          return newState;
        }),

      autoSeatFamily: (familyId, tableId) => {
        const state = get();
        const table = state.tables.find((t) => t.id === tableId);
        if (!table) return;

        const familyMembers = state.guests.filter(
          (g) => g.familyId === familyId && !g.tableId
        );

        const occupiedSeats = new Set(
          state.guests
            .filter((g) => g.tableId === tableId)
            .map((g) => g.seatIndex)
        );

        const availableSeats: number[] = [];
        for (let i = 0; i < table.seats; i++) {
          if (!occupiedSeats.has(i)) availableSeats.push(i);
        }

        if (availableSeats.length < familyMembers.length) return;

        const assignments = new Map<string, number>();
        familyMembers.forEach((g, idx) => {
          assignments.set(g.id, availableSeats[idx]);
        });

        set((s) => {
          const newState = {
            guests: s.guests.map((g) => {
              const seat = assignments.get(g.id);
              if (seat !== undefined) {
                return { ...g, tableId, seatIndex: seat };
              }
              return g;
            }),
          };
          syncToFirestore({ ...s, ...newState });
          return newState;
        });
      },

      // Venue
      venue: { ...defaultVenue },
      updateVenue: (updates) =>
        set((s) => {
          const newState = { venue: { ...s.venue, ...updates } };
          syncToFirestore({ ...s, ...newState });
          return newState;
        }),

      // Data management
      exportData: () => {
        const { guests, tables, venue } = get();
        return JSON.stringify({ guests, tables, venue }, null, 2);
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json);
          if (data.guests && data.tables && data.venue) {
            set({ guests: data.guests, tables: data.tables, venue: data.venue });
            syncToFirestore({ guests: data.guests, tables: data.tables, venue: data.venue });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      clearAll: () => {
        const newState = {
          guests: [] as Guest[],
          tables: [] as Table[],
          venue: { ...defaultVenue },
        };
        set(newState);
        syncToFirestore(newState);
      },
    }),
    {
      name: 'wedding-seating-chart',
    }
  )
);

// Listen for real-time updates from Firestore
onSnapshot(doc(db, 'seating-charts', 'default'), (snapshot) => {
  if (ignoreNextSnapshot) {
    ignoreNextSnapshot = false;
    return;
  }
  const data = snapshot.data();
  if (data?.guests && data?.tables && data?.venue) {
    useStore.setState({
      guests: data.guests as Guest[],
      tables: data.tables as Table[],
      venue: data.venue as VenueSettings,
    });
  }
});
