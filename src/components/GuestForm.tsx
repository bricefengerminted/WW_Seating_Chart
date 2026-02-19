import { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Guest, GuestSide, MealPreference } from '../types';
import { v4 as uuid } from 'uuid';

interface Props {
  guest?: Guest;
  onClose: () => void;
}

export function GuestForm({ guest, onClose }: Props) {
  const { addGuest, updateGuest, guests } = useStore();
  const [firstName, setFirstName] = useState(guest?.firstName || '');
  const [lastName, setLastName] = useState(guest?.lastName || '');
  const [familyName, setFamilyName] = useState(guest?.familyName || '');
  const [side, setSide] = useState<GuestSide>(guest?.side || 'mutual');
  const [meal, setMeal] = useState<MealPreference>(guest?.meal || 'standard');
  const [notes, setNotes] = useState(guest?.notes || '');

  // Get unique family names for autocomplete
  const existingFamilies = [...new Set(guests.map((g) => g.familyName))].sort();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    const resolvedFamilyName = familyName.trim() || lastName.trim();

    if (guest) {
      // Find if this family name matches an existing family
      const existingFamily = guests.find(
        (g) => g.familyName === resolvedFamilyName && g.id !== guest.id
      );
      updateGuest(guest.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        familyName: resolvedFamilyName,
        familyId: existingFamily ? existingFamily.familyId : guest.familyId,
        side,
        meal,
        notes: notes.trim(),
      });
    } else {
      const existingFamily = guests.find((g) => g.familyName === resolvedFamilyName);
      addGuest({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        familyId: existingFamily ? existingFamily.familyId : uuid(),
        familyName: resolvedFamilyName,
        side,
        meal,
        rsvp: 'pending',
        notes: notes.trim(),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{guest ? 'Edit Guest' : 'Add Guest'}</h2>
          <button className="btn-ghost p-1" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name</label>
              <input
                className="input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input
                className="input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Family / Group Name</label>
            <input
              className="input"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="Defaults to last name"
              list="family-suggestions"
            />
            <datalist id="family-suggestions">
              {existingFamilies.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
            <p className="text-xs text-stone-400 mt-1">
              Guests with the same family name are grouped together.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Side</label>
              <select className="select" value={side} onChange={(e) => setSide(e.target.value as GuestSide)}>
                <option value="bride">Bride's Side</option>
                <option value="groom">Groom's Side</option>
                <option value="mutual">Mutual</option>
              </select>
            </div>
            <div>
              <label className="label">Meal Preference</label>
              <select className="select" value={meal} onChange={(e) => setMeal(e.target.value as MealPreference)}>
                <option value="standard">Standard</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="kosher">Kosher</option>
                <option value="halal">Halal</option>
                <option value="gluten-free">Gluten-Free</option>
                <option value="kids">Kids' Meal</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Allergies, accessibility needs, etc."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {guest ? 'Save Changes' : 'Add Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
