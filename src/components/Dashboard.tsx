import { useMemo, useState, useRef } from 'react';
import {
  Users,
  Armchair,
  UtensilsCrossed,
  AlertTriangle,
  Download,
  Upload,
  Trash2,
  Printer,
  Heart,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import type { MealPreference, GuestSide } from '../types';

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

export function Dashboard() {
  const { guests, tables, exportData, importData, clearAll } = useStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const accepted = guests.filter((g) => g.rsvp === 'accepted');
    const declined = guests.filter((g) => g.rsvp === 'declined');
    const pending = guests.filter((g) => g.rsvp === 'pending');
    const seated = guests.filter((g) => g.tableId);
    const unseated = guests.filter((g) => !g.tableId && g.rsvp !== 'declined');
    const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);

    // Meal counts (accepted guests only)
    const mealCounts = new Map<MealPreference, number>();
    accepted.forEach((g) => {
      mealCounts.set(g.meal, (mealCounts.get(g.meal) || 0) + 1);
    });

    // Side counts
    const sideCounts: Record<GuestSide, number> = { bride: 0, groom: 0, mutual: 0 };
    guests.forEach((g) => {
      if (g.rsvp !== 'declined') sideCounts[g.side]++;
    });

    // Family completeness
    const familyMap = new Map<string, { name: string; total: number; seated: number }>();
    guests.forEach((g) => {
      if (g.rsvp === 'declined') return;
      const entry = familyMap.get(g.familyId) || { name: g.familyName, total: 0, seated: 0 };
      entry.total++;
      if (g.tableId) entry.seated++;
      familyMap.set(g.familyId, entry);
    });
    const splitFamilies = Array.from(familyMap.values()).filter(
      (f) => f.seated > 0 && f.seated < f.total
    );

    // Table utilization
    const tableStats = tables.map((t) => {
      const count = guests.filter((g) => g.tableId === t.id).length;
      return { name: t.name, seated: count, total: t.seats, pct: Math.round((count / t.seats) * 100) };
    });

    return {
      total: guests.length,
      accepted: accepted.length,
      declined: declined.length,
      pending: pending.length,
      seated: seated.length,
      unseated: unseated.length,
      totalSeats,
      mealCounts,
      sideCounts,
      splitFamilies,
      tableStats,
      tableCount: tables.length,
    };
  }, [guests, tables]);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wedding-seating-chart.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const success = importData(text);
      if (!success) alert('Invalid file format. Please use a file exported from this app.');
    };
    reader.readAsText(file);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Key stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard icon={<Users size={18} />} label="Total Guests" value={stats.total} color="text-stone-700" />
        <StatCard icon={<Heart size={18} />} label="Accepted" value={stats.accepted} color="text-emerald-600" />
        <StatCard icon={<Users size={18} />} label="Pending" value={stats.pending} color="text-amber-600" />
        <StatCard icon={<Users size={18} />} label="Declined" value={stats.declined} color="text-red-600" />
        <StatCard icon={<Armchair size={18} />} label="Seated" value={stats.seated} color="text-blue-600" />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Unseated"
          value={stats.unseated}
          color={stats.unseated > 0 ? 'text-amber-600' : 'text-emerald-600'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Capacity */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-3">Seating Capacity</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Total seats</span>
              <span className="font-medium">{stats.totalSeats}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Guests (non-declined)</span>
              <span className="font-medium">{stats.total - stats.declined}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Available seats</span>
              <span className={`font-medium ${stats.totalSeats - stats.seated < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {stats.totalSeats - stats.seated}
              </span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-3 mt-2">
              <div
                className="bg-rose-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(100, stats.totalSeats > 0 ? (stats.seated / stats.totalSeats) * 100 : 0)}%` }}
              />
            </div>
            <div className="text-xs text-stone-400 text-center">
              {stats.totalSeats > 0 ? Math.round((stats.seated / stats.totalSeats) * 100) : 0}% occupied
            </div>
          </div>
        </div>

        {/* Meal breakdown */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <UtensilsCrossed size={14} /> Meal Preferences
          </h3>
          <div className="space-y-1.5">
            {Array.from(stats.mealCounts.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([meal, count]) => (
                <div key={meal} className="flex justify-between text-sm">
                  <span className="text-stone-500">{mealLabels[meal]}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            {stats.mealCounts.size === 0 && (
              <p className="text-xs text-stone-400">No accepted guests yet.</p>
            )}
          </div>
        </div>

        {/* Side breakdown */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-3">Guest Breakdown by Side</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-pink-600">Bride's Side</span>
              <span className="font-medium">{stats.sideCounts.bride}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-600">Groom's Side</span>
              <span className="font-medium">{stats.sideCounts.groom}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-purple-600">Mutual</span>
              <span className="font-medium">{stats.sideCounts.mutual}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table utilization */}
      {stats.tableStats.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-3">Table Utilization</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {stats.tableStats.map((t) => (
              <div key={t.name} className="bg-stone-50 rounded-lg p-3">
                <div className="text-xs font-medium mb-1">{t.name}</div>
                <div className="flex items-end gap-1">
                  <span className="text-lg font-bold">{t.seated}</span>
                  <span className="text-xs text-stone-400 mb-0.5">/ {t.total}</span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-1.5 mt-1">
                  <div
                    className={`h-1.5 rounded-full ${
                      t.pct === 100 ? 'bg-emerald-500' : t.pct > 0 ? 'bg-amber-400' : 'bg-stone-300'
                    }`}
                    style={{ width: `${t.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Split families warning */}
      {stats.splitFamilies.length > 0 && (
        <div className="card p-5 border-amber-200 bg-amber-50">
          <h3 className="text-sm font-semibold mb-2 text-amber-800 flex items-center gap-2">
            <AlertTriangle size={14} /> Split Families
          </h3>
          <p className="text-xs text-amber-600 mb-2">
            These families have some members seated and some not:
          </p>
          <div className="space-y-1">
            {stats.splitFamilies.map((f) => (
              <div key={f.name} className="text-sm text-amber-700">
                <strong>{f.name}</strong>: {f.seated} seated, {f.total - f.seated} still need seats
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data actions */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-3">Data Management</h3>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary btn-sm" onClick={handleExport}>
            <Download size={14} /> Export JSON
          </button>
          <button className="btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} /> Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <button className="btn-secondary btn-sm" onClick={handlePrint}>
            <Printer size={14} /> Print Chart
          </button>
          <div className="ml-auto">
            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600">Are you sure?</span>
                <button className="btn-danger btn-sm" onClick={() => { clearAll(); setShowClearConfirm(false); }}>
                  Yes, Clear All
                </button>
                <button className="btn-secondary btn-sm" onClick={() => setShowClearConfirm(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button className="btn-danger btn-sm" onClick={() => setShowClearConfirm(true)}>
                <Trash2 size={14} /> Clear All Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="card p-4 text-center">
      <div className={`${color} mb-1 flex justify-center`}>{icon}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-stone-500">{label}</div>
    </div>
  );
}
