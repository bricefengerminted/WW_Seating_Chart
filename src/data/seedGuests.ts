import { v4 as uuid } from 'uuid';
import type { Guest } from '../types';

export function generateSeedGuests(): Guest[] {
  const guests: Guest[] = [];

  function addFamily(
    familyName: string,
    side: Guest['side'],
    members: { firstName: string; lastName: string; meal: Guest['meal']; rsvp: Guest['rsvp']; notes?: string }[]
  ) {
    const familyId = uuid();
    for (const m of members) {
      guests.push({
        id: uuid(),
        firstName: m.firstName,
        lastName: m.lastName,
        familyId,
        familyName,
        side,
        meal: m.meal,
        rsvp: m.rsvp,
        notes: m.notes || '',
        tableId: null,
        seatIndex: null,
      });
    }
  }

  // --- Bride's Side ---

  // Johnson Family (4) — Parents + 2 kids
  addFamily('Johnson', 'bride', [
    { firstName: 'Robert', lastName: 'Johnson', meal: 'standard', rsvp: 'accepted' },
    { firstName: 'Linda', lastName: 'Johnson', meal: 'vegetarian', rsvp: 'accepted' },
    { firstName: 'Emma', lastName: 'Johnson', meal: 'kids', rsvp: 'accepted' },
    { firstName: 'Tyler', lastName: 'Johnson', meal: 'kids', rsvp: 'accepted' },
  ]);

  // Garcia Family (5) — Big family
  addFamily('Garcia', 'bride', [
    { firstName: 'Carlos', lastName: 'Garcia', meal: 'standard', rsvp: 'accepted' },
    { firstName: 'Maria', lastName: 'Garcia', meal: 'standard', rsvp: 'accepted' },
    { firstName: 'Sofia', lastName: 'Garcia', meal: 'vegetarian', rsvp: 'accepted' },
    { firstName: 'Diego', lastName: 'Garcia', meal: 'standard', rsvp: 'pending' },
    { firstName: 'Isabella', lastName: 'Garcia', meal: 'kids', rsvp: 'accepted' },
  ]);

  // O'Brien Family (3) — Parents + adult child
  addFamily("O'Brien", 'bride', [
    { firstName: 'Sean', lastName: "O'Brien", meal: 'standard', rsvp: 'accepted' },
    { firstName: 'Colleen', lastName: "O'Brien", meal: 'standard', rsvp: 'accepted' },
    { firstName: 'Liam', lastName: "O'Brien", meal: 'standard', rsvp: 'pending' },
  ]);

  // Thompson Family (3) — Declined
  addFamily('Thompson', 'bride', [
    { firstName: 'Michael', lastName: 'Thompson', meal: 'standard', rsvp: 'declined' },
    { firstName: 'Rachel', lastName: 'Thompson', meal: 'standard', rsvp: 'declined' },
    { firstName: 'Olivia', lastName: 'Thompson', meal: 'kids', rsvp: 'declined' },
  ]);

  // Foster Family (2) — Pending couple
  addFamily('Foster', 'bride', [
    { firstName: 'Greg', lastName: 'Foster', meal: 'standard', rsvp: 'pending' },
    { firstName: 'Diane', lastName: 'Foster', meal: 'vegetarian', rsvp: 'pending' },
  ]);

  // Rossi Family (2) — Couple
  addFamily('Rossi', 'bride', [
    { firstName: 'Marco', lastName: 'Rossi', meal: 'standard', rsvp: 'accepted' },
    { firstName: 'Giulia', lastName: 'Rossi', meal: 'gluten-free', rsvp: 'accepted' },
  ]);

  // Claire Anderson (1) — Solo, accessibility needs
  addFamily('Anderson', 'bride', [
    { firstName: 'Claire', lastName: 'Anderson', meal: 'vegan', rsvp: 'accepted', notes: 'Wheelchair accessible seating needed' },
  ]);

  // Nicole Davis (1) — Solo
  addFamily('Davis', 'bride', [
    { firstName: 'Nicole', lastName: 'Davis', meal: 'standard', rsvp: 'accepted', notes: 'Plus one TBD' },
  ]);

  // --- Groom's Side ---

  // Chen Family (3) — Parents + adult child
  addFamily('Chen', 'groom', [
    { firstName: 'Wei', lastName: 'Chen', meal: 'standard', rsvp: 'accepted' },
    { firstName: 'Mei', lastName: 'Chen', meal: 'vegetarian', rsvp: 'accepted' },
    { firstName: 'David', lastName: 'Chen', meal: 'standard', rsvp: 'accepted' },
  ]);

  // Williams Family (2) — Couple, dietary note
  addFamily('Williams', 'groom', [
    { firstName: 'James', lastName: 'Williams', meal: 'standard', rsvp: 'accepted' },
    { firstName: 'Sarah', lastName: 'Williams', meal: 'gluten-free', rsvp: 'accepted', notes: 'Celiac disease — strict gluten-free' },
  ]);

  // Nakamura Family (2) — Couple
  addFamily('Nakamura', 'groom', [
    { firstName: 'Takeshi', lastName: 'Nakamura', meal: 'standard', rsvp: 'accepted' },
    { firstName: 'Yuki', lastName: 'Nakamura', meal: 'vegan', rsvp: 'accepted', notes: 'Strict vegan — no honey' },
  ]);

  // Kim Family (4) — Parents + 2 adult children
  addFamily('Kim', 'groom', [
    { firstName: 'Joon', lastName: 'Kim', meal: 'standard', rsvp: 'accepted' },
    { firstName: 'Soo-Yun', lastName: 'Kim', meal: 'kosher', rsvp: 'accepted' },
    { firstName: 'Daniel', lastName: 'Kim', meal: 'standard', rsvp: 'accepted' },
    { firstName: 'Grace', lastName: 'Kim', meal: 'standard', rsvp: 'pending' },
  ]);

  // Singh Family (3) — Parents + adult child
  addFamily('Singh', 'groom', [
    { firstName: 'Vikram', lastName: 'Singh', meal: 'vegetarian', rsvp: 'accepted' },
    { firstName: 'Deepa', lastName: 'Singh', meal: 'vegetarian', rsvp: 'accepted' },
    { firstName: 'Rohan', lastName: 'Singh', meal: 'standard', rsvp: 'accepted' },
  ]);

  // Park Family (2) — Couple, pending
  addFamily('Park', 'groom', [
    { firstName: 'Jun', lastName: 'Park', meal: 'standard', rsvp: 'pending' },
    { firstName: 'Hana', lastName: 'Park', meal: 'vegan', rsvp: 'pending' },
  ]);

  // Lee Family (2) — Couple, allergy
  addFamily('Lee', 'groom', [
    { firstName: 'Brandon', lastName: 'Lee', meal: 'standard', rsvp: 'accepted' },
    { firstName: 'Amy', lastName: 'Lee', meal: 'other', rsvp: 'accepted', notes: 'Severe nut allergy — needs nut-free meal' },
  ]);

  // Brent Taylor (1) — Solo, declined
  addFamily('Taylor', 'groom', [
    { firstName: 'Brent', lastName: 'Taylor', meal: 'standard', rsvp: 'declined' },
  ]);

  // --- Mutual ---

  // Patel Family (4) — Parents + 2 kids
  addFamily('Patel', 'mutual', [
    { firstName: 'Raj', lastName: 'Patel', meal: 'vegetarian', rsvp: 'accepted' },
    { firstName: 'Priya', lastName: 'Patel', meal: 'vegetarian', rsvp: 'accepted' },
    { firstName: 'Arjun', lastName: 'Patel', meal: 'vegetarian', rsvp: 'accepted' },
    { firstName: 'Ananya', lastName: 'Patel', meal: 'kids', rsvp: 'accepted' },
  ]);

  // Martinez Family (2) — Couple
  addFamily('Martinez', 'mutual', [
    { firstName: 'Antonio', lastName: 'Martinez', meal: 'standard', rsvp: 'accepted' },
    { firstName: 'Lisa', lastName: 'Martinez', meal: 'halal', rsvp: 'accepted' },
  ]);

  // Murphy Family (3) — Parents + kid
  addFamily('Murphy', 'mutual', [
    { firstName: 'Patrick', lastName: 'Murphy', meal: 'standard', rsvp: 'accepted' },
    { firstName: 'Fiona', lastName: 'Murphy', meal: 'vegetarian', rsvp: 'accepted' },
    { firstName: 'Cian', lastName: 'Murphy', meal: 'kids', rsvp: 'accepted' },
  ]);

  // Jake Cooper (1) — Solo
  addFamily('Cooper', 'mutual', [
    { firstName: 'Jake', lastName: 'Cooper', meal: 'standard', rsvp: 'accepted' },
  ]);

  return guests;
}
