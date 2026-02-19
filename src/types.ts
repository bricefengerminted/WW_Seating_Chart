export type MealPreference = 'standard' | 'vegetarian' | 'vegan' | 'kosher' | 'halal' | 'gluten-free' | 'kids' | 'other';
export type RSVPStatus = 'pending' | 'accepted' | 'declined';
export type GuestSide = 'bride' | 'groom' | 'mutual';
export type TableShape = 'round' | 'rectangular' | 'long';
export type AppView = 'guests' | 'venue' | 'seating' | 'dashboard';

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  familyId: string;
  familyName: string;
  side: GuestSide;
  meal: MealPreference;
  rsvp: RSVPStatus;
  notes: string;
  tableId: string | null;
  seatIndex: number | null;
}

export interface Table {
  id: string;
  name: string;
  shape: TableShape;
  seats: number;
  x: number;
  y: number;
  rotation: number;
}

export interface VenueSettings {
  name: string;
  width: number;
  height: number;
}
