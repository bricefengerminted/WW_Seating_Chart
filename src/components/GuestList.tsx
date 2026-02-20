import { useState, useMemo } from 'react';
import {
  UserPlus,
  Users,
  Search,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronRight,
  Upload,
  Filter,
  Database,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Guest, GuestSide, MealPreference, RSVPStatus } from '../types';
import { GuestForm } from './GuestForm';
import { FamilyForm } from './FamilyForm';
import { CSVImport } from './CSVImport';

const sideLabels: Record<GuestSide, string> = {
  bride: "Bride's Side",
  groom: "Groom's Side",
  mutual: 'Mutual',
};

const mealLabels: Record<MealPreference, string> = {
  standard: 'Standard',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  kosher: 'Kosher',
  halal: 'Halal',
  'gluten-free': 'Gluten-Free',
  kids: "Kids' Meal",
  other: 'Other',
};

const rsvpColors: Record<RSVPStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-red-100 text-red-700',
};

export function GuestList() {
  const { guests, removeGuest, updateGuest, loadSeedData } = useStore();
  const [search, setSearch] = useState('');
  const [filterSide, setFilterSide] = useState<GuestSide | 'all'>('all');
  const [filterRsvp, setFilterRsvp] = useState<RSVPStatus | 'all'>('all');
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());
  const [groupByFamily, setGroupByFamily] = useState(true);

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      if (filterSide !== 'all' && g.side !== filterSide) return false;
      if (filterRsvp !== 'all' && g.rsvp !== filterRsvp) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          g.firstName.toLowerCase().includes(q) ||
          g.lastName.toLowerCase().includes(q) ||
          g.familyName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [guests, search, filterSide, filterRsvp]);

  const familyGroups = useMemo(() => {
    if (!groupByFamily) return null;
    const map = new Map<string, Guest[]>();
    filtered.forEach((g) => {
      const list = map.get(g.familyId) || [];
      list.push(g);
      map.set(g.familyId, list);
    });
    return Array.from(map.entries()).sort((a, b) =>
      a[1][0].familyName.localeCompare(b[1][0].familyName)
    );
  }, [filtered, groupByFamily]);

  const toggleFamily = (familyId: string) => {
    setExpandedFamilies((prev) => {
      const next = new Set(prev);
      if (next.has(familyId)) next.delete(familyId);
      else next.add(familyId);
      return next;
    });
  };

  const acceptedCount = guests.filter((g) => g.rsvp === 'accepted').length;
  const declinedCount = guests.filter((g) => g.rsvp === 'declined').length;
  const pendingCount = guests.filter((g) => g.rsvp === 'pending').length;

  return (
    <div className="h-full flex flex-col">
      {/* Header stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-stone-800">{guests.length}</div>
          <div className="text-xs text-stone-500">Total Guests</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{acceptedCount}</div>
          <div className="text-xs text-stone-500">Accepted</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          <div className="text-xs text-stone-500">Pending</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{declinedCount}</div>
          <div className="text-xs text-stone-500">Declined</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button className="btn-primary btn-sm" onClick={() => setShowAddGuest(true)}>
          <UserPlus size={14} /> Add Guest
        </button>
        <button className="btn-secondary btn-sm" onClick={() => setShowAddFamily(true)}>
          <Users size={14} /> Add Family
        </button>
        <button className="btn-secondary btn-sm" onClick={() => setShowCSVImport(true)}>
          <Upload size={14} /> Import CSV
        </button>
      </div>

      {/* Search & filters */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="input pl-9"
            placeholder="Search guests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="select w-auto"
          value={filterSide}
          onChange={(e) => setFilterSide(e.target.value as GuestSide | 'all')}
        >
          <option value="all">All Sides</option>
          <option value="bride">Bride's Side</option>
          <option value="groom">Groom's Side</option>
          <option value="mutual">Mutual</option>
        </select>
        <select
          className="select w-auto"
          value={filterRsvp}
          onChange={(e) => setFilterRsvp(e.target.value as RSVPStatus | 'all')}
        >
          <option value="all">All RSVP</option>
          <option value="accepted">Accepted</option>
          <option value="pending">Pending</option>
          <option value="declined">Declined</option>
        </select>
        <button
          className={`btn-sm ${groupByFamily ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setGroupByFamily(!groupByFamily)}
          title="Group by family"
        >
          <Filter size={14} />
        </button>
      </div>

      {/* Guest list */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-stone-400">
            {guests.length === 0 ? (
              <div className="space-y-3">
                <p>No guests yet. Add your first guest or import a CSV!</p>
                <button
                  className="btn-secondary btn-sm inline-flex items-center gap-1.5"
                  onClick={loadSeedData}
                >
                  <Database size={14} /> Load Demo Data (50 guests)
                </button>
              </div>
            ) : (
              'No guests match your search.'
            )}
          </div>
        )}

        {groupByFamily && familyGroups
          ? familyGroups.map(([familyId, members]) => {
              const isExpanded = expandedFamilies.has(familyId);
              return (
                <div key={familyId} className="card overflow-hidden">
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-stone-50 transition-colors"
                    onClick={() => toggleFamily(familyId)}
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span className="font-medium text-sm">{members[0].familyName} Family</span>
                    <span className={`badge-${members[0].side} ml-1`}>
                      {sideLabels[members[0].side]}
                    </span>
                    <span className="text-xs text-stone-400 ml-auto">
                      {members.length} {members.length === 1 ? 'guest' : 'guests'}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-stone-100">
                      {members.map((g) => (
                        <GuestRow
                          key={g.id}
                          guest={g}
                          onEdit={() => setEditingGuest(g)}
                          onRemove={() => removeGuest(g.id)}
                          onUpdateRsvp={(rsvp) => updateGuest(g.id, { rsvp })}
                          indent
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          : filtered.map((g) => (
              <div key={g.id} className="card">
                <GuestRow
                  guest={g}
                  onEdit={() => setEditingGuest(g)}
                  onRemove={() => removeGuest(g.id)}
                  onUpdateRsvp={(rsvp) => updateGuest(g.id, { rsvp })}
                />
              </div>
            ))}
      </div>

      {/* Seed data */}
      <div className="pt-3 mt-3 border-t border-stone-200 flex justify-center">
        <button
          className="btn-ghost btn-sm text-xs text-stone-400 hover:text-stone-600 inline-flex items-center gap-1.5"
          onClick={loadSeedData}
        >
          <Database size={12} /> Load Demo Data (50 guests)
        </button>
      </div>

      {/* Modals */}
      {showAddGuest && <GuestForm onClose={() => setShowAddGuest(false)} />}
      {showAddFamily && <FamilyForm onClose={() => setShowAddFamily(false)} />}
      {showCSVImport && <CSVImport onClose={() => setShowCSVImport(false)} />}
      {editingGuest && (
        <GuestForm guest={editingGuest} onClose={() => setEditingGuest(null)} />
      )}
    </div>
  );
}

function GuestRow({
  guest,
  onEdit,
  onRemove,
  onUpdateRsvp,
  indent,
}: {
  guest: Guest;
  onEdit: () => void;
  onRemove: () => void;
  onUpdateRsvp: (rsvp: RSVPStatus) => void;
  indent?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 hover:bg-stone-50 transition-colors ${
        indent ? 'pl-10' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {guest.firstName} {guest.lastName}
          </span>
          {!indent && (
            <span className={`badge-${guest.side}`}>
              {sideLabels[guest.side]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <span>{mealLabels[guest.meal]}</span>
          {guest.tableId && (
            <>
              <span>&middot;</span>
              <span className="text-rose-500">Seated</span>
            </>
          )}
        </div>
      </div>
      <select
        className="text-xs rounded border border-stone-200 px-2 py-1 bg-white cursor-pointer"
        value={guest.rsvp}
        onChange={(e) => onUpdateRsvp(e.target.value as RSVPStatus)}
        onClick={(e) => e.stopPropagation()}
      >
        <option value="pending">Pending</option>
        <option value="accepted">Accepted</option>
        <option value="declined">Declined</option>
      </select>
      <span className={`badge ${rsvpColors[guest.rsvp]} text-xs`}>
        {guest.rsvp}
      </span>
      <button className="btn-ghost btn-sm p-1" onClick={onEdit} title="Edit">
        <Edit3 size={14} />
      </button>
      <button className="btn-ghost btn-sm p-1 text-red-500 hover:text-red-700" onClick={onRemove} title="Remove">
        <Trash2 size={14} />
      </button>
    </div>
  );
}
