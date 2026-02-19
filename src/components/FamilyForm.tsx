import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { GuestSide, MealPreference } from '../types';

interface FamilyMember {
  firstName: string;
  lastName: string;
  meal: MealPreference;
}

interface Props {
  onClose: () => void;
}

export function FamilyForm({ onClose }: Props) {
  const { bulkAddFamily } = useStore();
  const [familyName, setFamilyName] = useState('');
  const [side, setSide] = useState<GuestSide>('mutual');
  const [members, setMembers] = useState<FamilyMember[]>([
    { firstName: '', lastName: '', meal: 'standard' },
    { firstName: '', lastName: '', meal: 'standard' },
  ]);

  const updateMember = (idx: number, updates: Partial<FamilyMember>) => {
    setMembers((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, ...updates } : m))
    );
  };

  const addMember = () => {
    setMembers((prev) => [...prev, { firstName: '', lastName: familyName, meal: 'standard' }]);
  };

  const removeMember = (idx: number) => {
    if (members.length <= 1) return;
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) return;

    const validMembers = members.filter((m) => m.firstName.trim());
    if (validMembers.length === 0) return;

    const completedMembers = validMembers.map((m) => ({
      firstName: m.firstName.trim(),
      lastName: m.lastName.trim() || familyName.trim(),
      meal: m.meal,
    }));

    bulkAddFamily(familyName.trim(), side, completedMembers);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Family / Group</h2>
          <button className="btn-ghost p-1" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Family Name</label>
              <input
                className="input"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g. Smith"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Side</label>
              <select className="select" value={side} onChange={(e) => setSide(e.target.value as GuestSide)}>
                <option value="bride">Bride's Side</option>
                <option value="groom">Groom's Side</option>
                <option value="mutual">Mutual</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Members</label>
              <button type="button" className="btn-ghost btn-sm" onClick={addMember}>
                <Plus size={14} /> Add Member
              </button>
            </div>
            <div className="space-y-2">
              {members.map((m, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    className="input flex-1"
                    placeholder="First name"
                    value={m.firstName}
                    onChange={(e) => updateMember(idx, { firstName: e.target.value })}
                  />
                  <input
                    className="input flex-1"
                    placeholder={familyName || 'Last name'}
                    value={m.lastName}
                    onChange={(e) => updateMember(idx, { lastName: e.target.value })}
                  />
                  <select
                    className="select w-auto text-xs"
                    value={m.meal}
                    onChange={(e) => updateMember(idx, { meal: e.target.value as MealPreference })}
                  >
                    <option value="standard">Standard</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="kids">Kids</option>
                    <option value="other">Other</option>
                  </select>
                  <button
                    type="button"
                    className="btn-ghost btn-sm p-1 text-red-500"
                    onClick={() => removeMember(idx)}
                    disabled={members.length <= 1}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Family ({members.filter((m) => m.firstName.trim()).length} members)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
