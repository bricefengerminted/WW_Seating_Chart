import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Search, Users, UserMinus, Wand2, X, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Guest, Table } from '../types';

export function SeatingChart() {
  const { guests, tables, assignSeat, autoSeatFamily } = useStore();
  const [search, setSearch] = useState('');
  const [activeGuest, setActiveGuest] = useState<Guest | null>(null);
  const [showOnlyUnseated, setShowOnlyUnseated] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const unseatedGuests = useMemo(
    () => guests.filter((g) => !g.tableId && g.rsvp !== 'declined'),
    [guests]
  );

  const filteredGuests = useMemo(() => {
    const list = showOnlyUnseated
      ? unseatedGuests
      : guests.filter((g) => g.rsvp !== 'declined');

    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      (g) =>
        g.firstName.toLowerCase().includes(q) ||
        g.lastName.toLowerCase().includes(q) ||
        g.familyName.toLowerCase().includes(q)
    );
  }, [guests, unseatedGuests, search, showOnlyUnseated]);

  // Group unseated guests by family
  const familyGroups = useMemo(() => {
    const map = new Map<string, Guest[]>();
    filteredGuests.forEach((g) => {
      const list = map.get(g.familyId) || [];
      list.push(g);
      map.set(g.familyId, list);
    });
    return Array.from(map.entries()).sort((a, b) =>
      a[1][0].familyName.localeCompare(b[1][0].familyName)
    );
  }, [filteredGuests]);

  // Find split families (some seated, some not)
  const splitFamilies = useMemo(() => {
    const familyMap = new Map<string, { seated: number; unseated: number; name: string }>();
    guests.forEach((g) => {
      if (g.rsvp === 'declined') return;
      const entry = familyMap.get(g.familyId) || { seated: 0, unseated: 0, name: g.familyName };
      if (g.tableId) entry.seated++;
      else entry.unseated++;
      familyMap.set(g.familyId, entry);
    });
    return Array.from(familyMap.entries()).filter(
      ([, v]) => v.seated > 0 && v.unseated > 0
    );
  }, [guests]);

  const handleDragStart = (event: DragStartEvent) => {
    const guest = guests.find((g) => g.id === event.active.id);
    if (guest) setActiveGuest(guest);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveGuest(null);
    const { active, over } = event;
    if (!over) return;

    const guestId = active.id as string;
    const dropId = over.id as string;

    // Parse the drop target: "table-{id}-seat-{index}"
    const match = dropId.match(/^table-(.+)-seat-(\d+)$/);
    if (match) {
      assignSeat(guestId, match[1], parseInt(match[2]));
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full flex gap-4">
        {/* Left panel: guest list */}
        <div className="w-80 flex flex-col card p-4">
          <h3 className="font-semibold text-sm mb-3">
            Guest List
            <span className="text-stone-400 font-normal ml-2">
              {unseatedGuests.length} unseated
            </span>
          </h3>

          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              className="input pl-9"
              placeholder="Search guests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-stone-500 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyUnseated}
              onChange={(e) => setShowOnlyUnseated(e.target.checked)}
              className="rounded"
            />
            Show only unseated guests
          </label>

          {/* Split family warnings */}
          {splitFamilies.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 mb-1">
                <AlertTriangle size={12} />
                Split Families
              </div>
              {splitFamilies.map(([fid, info]) => (
                <div key={fid} className="text-xs text-amber-600">
                  {info.name}: {info.unseated} not yet seated
                </div>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-1">
            {familyGroups.map(([familyId, members]) => (
              <div key={familyId} className="mb-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users size={12} className="text-stone-400" />
                  <span className="text-xs font-medium text-stone-500">
                    {members[0].familyName}
                  </span>
                  {/* Auto-seat family button */}
                  {tables.length > 0 && members.some((m) => !m.tableId) && (
                    <button
                      className="ml-auto text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1"
                      title="Auto-seat this family at a table with enough room"
                      onClick={() => {
                        const unseatedMembers = members.filter((m) => !m.tableId);
                        const tableWithRoom = tables.find((t) => {
                          const seated = guests.filter((g) => g.tableId === t.id).length;
                          return t.seats - seated >= unseatedMembers.length;
                        });
                        if (tableWithRoom) {
                          autoSeatFamily(familyId, tableWithRoom.id);
                        }
                      }}
                    >
                      <Wand2 size={10} /> Auto-seat
                    </button>
                  )}
                </div>
                {members.map((guest) => (
                  <DraggableGuest key={guest.id} guest={guest} />
                ))}
              </div>
            ))}
            {filteredGuests.length === 0 && (
              <div className="text-center text-stone-400 text-sm py-8">
                {unseatedGuests.length === 0 ? 'All guests are seated!' : 'No matching guests.'}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: tables */}
        <div className="flex-1 overflow-auto">
          {tables.length === 0 ? (
            <div className="h-full flex items-center justify-center text-stone-400">
              <div className="text-center">
                <p className="text-lg mb-2">No tables yet</p>
                <p className="text-sm">Go to the Venue tab to add tables first.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {tables.map((table) => (
                <TableCard key={table.id} table={table} />
              ))}
            </div>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeGuest && (
          <div className="drag-overlay bg-white rounded-lg border-2 border-rose-400 shadow-lg px-3 py-2 text-sm font-medium">
            {activeGuest.firstName} {activeGuest.lastName}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function DraggableGuest({ guest }: { guest: Guest }) {
  const { unassignGuest } = useStore();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: guest.id,
  });

  const sideColor =
    guest.side === 'bride'
      ? 'border-l-pink-400'
      : guest.side === 'groom'
      ? 'border-l-blue-400'
      : 'border-l-purple-400';

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-l-4 ${sideColor} bg-white text-xs cursor-grab hover:shadow-sm transition-shadow ${
        isDragging ? 'opacity-50' : ''
      } ${guest.tableId ? 'bg-stone-50 text-stone-400' : ''}`}
    >
      <span className="flex-1 truncate">
        {guest.firstName} {guest.lastName}
      </span>
      {guest.tableId && (
        <button
          className="text-stone-400 hover:text-red-500"
          onClick={(e) => {
            e.stopPropagation();
            unassignGuest(guest.id);
          }}
          title="Unseat"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function TableCard({ table }: { table: Table }) {
  const { guests, unassignTable } = useStore();
  const seatedGuests = guests.filter((g) => g.tableId === table.id);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-sm">{table.name}</h4>
          <span className="text-xs text-stone-400">
            {table.shape} &middot; {seatedGuests.length}/{table.seats} seated
          </span>
        </div>
        {seatedGuests.length > 0 && (
          <button
            className="btn-ghost btn-sm text-xs text-red-500"
            onClick={() => unassignTable(table.id)}
            title="Clear all seats"
          >
            <UserMinus size={12} /> Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {Array.from({ length: table.seats }).map((_, i) => {
          const guest = seatedGuests.find((g) => g.seatIndex === i);
          return (
            <SeatSlot
              key={i}
              tableId={table.id}
              seatIndex={i}
              guest={guest || null}
            />
          );
        })}
      </div>
    </div>
  );
}

function SeatSlot({
  tableId,
  seatIndex,
  guest,
}: {
  tableId: string;
  seatIndex: number;
  guest: Guest | null;
}) {
  const { unassignGuest } = useStore();
  const { isOver, setNodeRef } = useDroppable({
    id: `table-${tableId}-seat-${seatIndex}`,
  });

  const sideColor = guest
    ? guest.side === 'bride'
      ? 'bg-pink-50 border-pink-200'
      : guest.side === 'groom'
      ? 'bg-blue-50 border-blue-200'
      : 'bg-purple-50 border-purple-200'
    : '';

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 border-dashed px-2 py-1.5 text-xs transition-colors ${
        isOver
          ? 'border-rose-400 bg-rose-50'
          : guest
          ? `border-solid ${sideColor}`
          : 'border-stone-200 bg-stone-50'
      }`}
    >
      {guest ? (
        <div className="flex items-center gap-1">
          <span className="flex-1 truncate font-medium">
            {guest.firstName} {guest.lastName[0]}.
          </span>
          <button
            className="text-stone-400 hover:text-red-500 shrink-0"
            onClick={() => unassignGuest(guest.id)}
          >
            <X size={10} />
          </button>
        </div>
      ) : (
        <span className="text-stone-300">Seat {seatIndex + 1}</span>
      )}
    </div>
  );
}
