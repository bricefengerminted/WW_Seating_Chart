import { useStore } from './store/useStore';
import { GuestList } from './components/GuestList';
import { VenueDesigner } from './components/VenueDesigner';
import { SeatingChart } from './components/SeatingChart';
import { Dashboard } from './components/Dashboard';
import { Users, MapPin, Grid3X3, BarChart3, Heart } from 'lucide-react';
import type { AppView } from './types';

const tabs: { id: AppView; label: string; icon: React.ReactNode }[] = [
  { id: 'guests', label: 'Guest List', icon: <Users size={16} /> },
  { id: 'venue', label: 'Venue', icon: <MapPin size={16} /> },
  { id: 'seating', label: 'Seating', icon: <Grid3X3 size={16} /> },
  { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
];

function App() {
  const { view, setView, guests, tables } = useStore();

  const unseated = guests.filter((g) => !g.tableId && g.rsvp !== 'declined').length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-3 no-print">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart size={20} className="text-rose-500" />
            <h1 className="text-lg font-semibold text-stone-800">Wedding Seating Planner</h1>
          </div>
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === tab.id
                    ? 'bg-rose-50 text-rose-700'
                    : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'guests' && guests.length > 0 && (
                  <span className="text-xs bg-stone-100 text-stone-500 rounded-full px-1.5 py-0.5">
                    {guests.length}
                  </span>
                )}
                {tab.id === 'seating' && unseated > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-600 rounded-full px-1.5 py-0.5">
                    {unseated}
                  </span>
                )}
                {tab.id === 'venue' && tables.length > 0 && (
                  <span className="text-xs bg-stone-100 text-stone-500 rounded-full px-1.5 py-0.5">
                    {tables.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full">
        {view === 'guests' && <GuestList />}
        {view === 'venue' && <VenueDesigner />}
        {view === 'seating' && <SeatingChart />}
        {view === 'dashboard' && <Dashboard />}
      </main>
    </div>
  );
}

export default App;
