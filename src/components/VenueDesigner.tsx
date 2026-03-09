import { useState, useRef, useCallback, useMemo } from 'react';
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
import { Plus, Trash2, RotateCw, Settings, Minus, Search, Users, X, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Table, TableShape, Guest } from '../types';

const TABLE_PRESETS: { label: string; shape: TableShape; seats: number }[] = [
  { label: 'Round (8)', shape: 'round', seats: 8 },
  { label: 'Round (10)', shape: 'round', seats: 10 },
  { label: 'Round (12)', shape: 'round', seats: 12 },
  { label: 'Rectangular (6)', shape: 'rectangular', seats: 6 },
  { label: 'Rectangular (8)', shape: 'rectangular', seats: 8 },
  { label: 'Long (10)', shape: 'long', seats: 10 },
  { label: 'Long (20)', shape: 'long', seats: 20 },
];

function getTableDimensions(table: Table) {
  switch (table.shape) {
    case 'round':
      return { width: 100 + table.seats * 14, height: 100 + table.seats * 14 };
    case 'rectangular':
      return { width: 160 + table.seats * 28, height: 90 };
    case 'long':
      return { width: 100 + table.seats * 32, height: 80 };
  }
}

const CHAIR_SIZE = 56;

function getChairPositions(table: Table, dims: { width: number; height: number }) {
  const positions: { x: number; y: number }[] = [];
  const half = CHAIR_SIZE / 2;

  if (table.shape === 'round') {
    for (let i = 0; i < table.seats; i++) {
      const angle = (i * 360) / table.seats - 90;
      const rad = (angle * Math.PI) / 180;
      const rx = dims.width / 2 + 10;
      const ry = dims.height / 2 + 10;
      positions.push({
        x: dims.width / 2 + rx * Math.cos(rad) - half,
        y: dims.height / 2 + ry * Math.sin(rad) - half,
      });
    }
  } else {
    // Rectangular and long: chairs along top and bottom edges
    const topCount = Math.ceil(table.seats / 2);
    const bottomCount = Math.floor(table.seats / 2);

    for (let i = 0; i < topCount; i++) {
      const spacing = dims.width / (topCount + 1);
      positions.push({
        x: spacing * (i + 1) - half,
        y: -CHAIR_SIZE - 2,
      });
    }

    for (let i = 0; i < bottomCount; i++) {
      const spacing = dims.width / (bottomCount + 1);
      positions.push({
        x: spacing * (i + 1) - half,
        y: dims.height + 2,
      });
    }
  }

  return positions;
}

export function VenueDesigner() {
  const { tables, addTable, updateTable, removeTable, guests, venue, updateVenue, assignSeat, unassignGuest } =
    useStore();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [guestSearch, setGuestSearch] = useState('');
  const [activeGuest, setActiveGuest] = useState<Guest | null>(null);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  const selectedTableData = tables.find((t) => t.id === selectedTable);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const getGuestsAtTable = (tableId: string) => guests.filter((g) => g.tableId === tableId);

  // Unseated guests for the sidebar
  const unseatedGuests = useMemo(() => {
    const list = guests.filter((g) => !g.tableId && g.rsvp !== 'declined');
    if (!guestSearch) return list;
    const q = guestSearch.toLowerCase();
    return list.filter(
      (g) =>
        g.firstName.toLowerCase().includes(q) ||
        g.lastName.toLowerCase().includes(q) ||
        g.familyName.toLowerCase().includes(q)
    );
  }, [guests, guestSearch]);

  // Group by family for sidebar
  const familyGroups = useMemo(() => {
    const map = new Map<string, Guest[]>();
    unseatedGuests.forEach((g) => {
      const list = map.get(g.familyId) || [];
      list.push(g);
      map.set(g.familyId, list);
    });
    return Array.from(map.entries()).sort((a, b) =>
      a[1][0].familyName.localeCompare(b[1][0].familyName)
    );
  }, [unseatedGuests]);

  // Table repositioning handlers (coordinates adjusted for zoom)
  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (activeGuest) return; // Don't reposition tables during guest drag
    e.stopPropagation();
    const table = tables.find((t) => t.id === tableId);
    if (!table || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - rect.left) / zoom - table.x,
      y: (e.clientY - rect.top) / zoom - table.y,
    });
    setDraggingTable(tableId);
    setSelectedTable(tableId);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingTable || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(venue.width - 40, (e.clientX - rect.left) / zoom - dragOffset.x));
      const y = Math.max(0, Math.min(venue.height - 40, (e.clientY - rect.top) / zoom - dragOffset.y));
      updateTable(draggingTable, { x, y });
    },
    [draggingTable, dragOffset, updateTable, venue, zoom]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingTable(null);
  }, []);

  const handleCanvasClick = () => {
    setSelectedTable(null);
  };

  const ZOOM_MIN = 0.25;
  const ZOOM_MAX = 2;
  const ZOOM_STEP = 0.15;

  const handleZoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
  const handleZoomReset = () => setZoom(1);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom((z) => {
          const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
          return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, +(z + delta).toFixed(2)));
        });
      }
    },
    []
  );

  // DnD handlers for guest-to-seat assignment
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

    const match = dropId.match(/^table-(.+)-seat-(\d+)$/);
    if (match) {
      assignSeat(guestId, match[1], parseInt(match[2]));
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-sm font-medium text-stone-600 mr-2">Add Table:</span>
          {TABLE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              className="btn-secondary btn-sm"
              onClick={() => addTable(preset.shape, preset.seats)}
            >
              <Plus size={12} /> {preset.label}
            </button>
          ))}
          <div className="ml-auto">
            <button className="btn-ghost btn-sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings size={14} /> Venue Settings
            </button>
          </div>
        </div>

        {/* Venue settings panel */}
        {showSettings && (
          <div className="card p-4 mb-4 flex gap-4 items-end">
            <div>
              <label className="label">Venue Name</label>
              <input
                className="input w-48"
                value={venue.name}
                onChange={(e) => updateVenue({ name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Width (px)</label>
              <input
                className="input w-24"
                type="number"
                value={venue.width}
                onChange={(e) => updateVenue({ width: Number(e.target.value) || 800 })}
              />
            </div>
            <div>
              <label className="label">Height (px)</label>
              <input
                className="input w-24"
                type="number"
                value={venue.height}
                onChange={(e) => updateVenue({ height: Number(e.target.value) || 600 })}
              />
            </div>
          </div>
        )}

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Guest sidebar */}
          <div className="w-64 flex flex-col card p-3 shrink-0">
            <h3 className="font-semibold text-sm mb-2">
              Guests
              <span className="text-stone-400 font-normal ml-2">
                {guests.filter((g) => !g.tableId && g.rsvp !== 'declined').length} unseated
              </span>
            </h3>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                className="input pl-8 text-xs"
                placeholder="Search guests..."
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-stone-400 mb-2">
              Drag guests onto chair slots to assign seats
            </p>
            <div className="flex-1 overflow-y-auto space-y-1">
              {familyGroups.map(([familyId, members]) => (
                <div key={familyId} className="mb-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Users size={10} className="text-stone-400" />
                    <span className="text-[10px] font-medium text-stone-500 truncate">
                      {members[0].familyName}
                    </span>
                  </div>
                  {members.map((guest) => (
                    <VenueDraggableGuest key={guest.id} guest={guest} />
                  ))}
                </div>
              ))}
              {unseatedGuests.length === 0 && (
                <div className="text-center text-stone-400 text-xs py-4">
                  {guests.filter((g) => g.rsvp !== 'declined').length === 0
                    ? 'No guests yet. Add guests from the Guest List tab.'
                    : 'All guests are seated!'}
                </div>
              )}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto relative" ref={canvasWrapperRef} onWheel={handleWheel}>
            {/* Zoom controls */}
            <div className="sticky top-2 left-2 z-30 inline-flex items-center gap-1 bg-white/90 backdrop-blur rounded-lg border border-stone-200 shadow-sm px-1.5 py-1 mb-2">
              <button className="btn-ghost p-1 rounded" onClick={handleZoomOut} title="Zoom out">
                <ZoomOut size={14} />
              </button>
              <button
                className="text-xs text-stone-600 font-medium px-1.5 min-w-[3rem] text-center hover:bg-stone-100 rounded cursor-pointer"
                onClick={handleZoomReset}
                title="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button className="btn-ghost p-1 rounded" onClick={handleZoomIn} title="Zoom in">
                <ZoomIn size={14} />
              </button>
              <button className="btn-ghost p-1 rounded" onClick={handleZoomReset} title="Fit to 100%">
                <Maximize size={14} />
              </button>
            </div>

            <div style={{ width: venue.width * zoom + 40, height: venue.height * zoom + 40, padding: 20 }}>
              <div
                ref={canvasRef}
                className="venue-canvas relative bg-white rounded-xl border-2 border-dashed border-stone-300"
                style={{
                  width: venue.width,
                  height: venue.height,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleCanvasClick}
              >
                {/* Venue name */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-stone-300 font-light text-lg pointer-events-none select-none">
                  {venue.name}
                </div>

                {tables.map((table) => {
                  const dims = getTableDimensions(table);
                  const seated = getGuestsAtTable(table.id);
                  const isFull = seated.length >= table.seats;
                  const isSelected = selectedTable === table.id;
                  const chairPositions = getChairPositions(table, dims);

                  return (
                    <div
                      key={table.id}
                      className={`absolute cursor-grab select-none transition-shadow ${
                        draggingTable === table.id ? 'cursor-grabbing z-20' : 'z-10'
                      } ${isSelected ? 'ring-2 ring-rose-400 ring-offset-2' : ''}`}
                      style={{
                        left: table.x,
                        top: table.y,
                        width: dims.width,
                        height: dims.height,
                        transform: `rotate(${table.rotation}deg)`,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, table.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTable(table.id);
                      }}
                    >
                      {/* Table shape */}
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center text-xs font-medium border-2 ${
                          isFull
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-amber-50 border-amber-300 text-amber-700'
                        } ${
                          table.shape === 'round'
                            ? 'rounded-full'
                            : table.shape === 'rectangular'
                            ? 'rounded-lg'
                            : 'rounded-md'
                        }`}
                      >
                        <span className="font-semibold">{table.name}</span>
                        <span className="text-[10px] opacity-70">
                          {seated.length}/{table.seats} seats
                        </span>
                      </div>

                      {/* Chair indicators (all table shapes) */}
                      {chairPositions.map((pos, i) => (
                        <VenueChair
                          key={i}
                          tableId={table.id}
                          seatIndex={i}
                          guest={seated.find((g) => g.seatIndex === i)}
                          x={pos.x}
                          y={pos.y}
                          isDragActive={activeGuest !== null}
                        />
                      ))}
                    </div>
                  );
                })}

                {tables.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-stone-300 text-lg">
                    Click "Add Table" above to start designing your venue
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table properties panel */}
          {selectedTableData && (
            <div className="w-64 card p-4 space-y-4 self-start shrink-0">
              <h3 className="font-semibold text-sm">Table Properties</h3>

              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  value={selectedTableData.name}
                  onChange={(e) => updateTable(selectedTableData.id, { name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Shape</label>
                <select
                  className="select"
                  value={selectedTableData.shape}
                  onChange={(e) =>
                    updateTable(selectedTableData.id, { shape: e.target.value as TableShape })
                  }
                >
                  <option value="round">Round</option>
                  <option value="rectangular">Rectangular</option>
                  <option value="long">Long / Banquet</option>
                </select>
              </div>

              <div>
                <label className="label">Seats</label>
                <div className="flex items-center gap-2">
                  <button
                    className="btn-secondary btn-sm p-1"
                    onClick={() =>
                      updateTable(selectedTableData.id, {
                        seats: Math.max(2, selectedTableData.seats - 1),
                      })
                    }
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    className="input text-center w-16"
                    type="number"
                    min={2}
                    max={30}
                    value={selectedTableData.seats}
                    onChange={(e) =>
                      updateTable(selectedTableData.id, {
                        seats: Math.max(2, Math.min(30, Number(e.target.value))),
                      })
                    }
                  />
                  <button
                    className="btn-secondary btn-sm p-1"
                    onClick={() =>
                      updateTable(selectedTableData.id, {
                        seats: Math.min(30, selectedTableData.seats + 1),
                      })
                    }
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Rotation</label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={selectedTableData.rotation}
                  onChange={(e) =>
                    updateTable(selectedTableData.id, { rotation: Number(e.target.value) })
                  }
                  className="w-full"
                />
                <div className="text-xs text-stone-400 text-center">{selectedTableData.rotation}&deg;</div>
              </div>

              <div className="text-xs text-stone-500">
                <p>
                  Guests seated:{' '}
                  <strong>
                    {getGuestsAtTable(selectedTableData.id).length}/{selectedTableData.seats}
                  </strong>
                </p>
              </div>

              {/* Seated guests list for this table */}
              {getGuestsAtTable(selectedTableData.id).length > 0 && (
                <div>
                  <label className="label">Seated Guests</label>
                  <div className="space-y-1">
                    {getGuestsAtTable(selectedTableData.id)
                      .sort((a, b) => (a.seatIndex ?? 0) - (b.seatIndex ?? 0))
                      .map((g) => (
                        <div
                          key={g.id}
                          className="flex items-center gap-1 text-xs bg-stone-50 rounded px-2 py-1"
                        >
                          <span className="text-stone-400 w-4">
                            {(g.seatIndex ?? 0) + 1}.
                          </span>
                          <span className="flex-1 truncate">
                            {g.firstName} {g.lastName}
                          </span>
                          <button
                            className="text-stone-400 hover:text-red-500"
                            onClick={() => unassignGuest(g.id)}
                            title="Unseat"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  className="btn-secondary btn-sm flex-1"
                  onClick={() => updateTable(selectedTableData.id, { rotation: 0 })}
                >
                  <RotateCw size={12} /> Reset
                </button>
                <button
                  className="btn-danger btn-sm flex-1"
                  onClick={() => {
                    removeTable(selectedTableData.id);
                    setSelectedTable(null);
                  }}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeGuest && (
          <div
            className={`rounded-full border-2 text-[10px] font-medium flex flex-col items-center justify-center shadow-lg cursor-grabbing ${
              activeGuest.side === 'bride'
                ? 'bg-pink-400 border-pink-500 text-white'
                : activeGuest.side === 'groom'
                ? 'bg-blue-400 border-blue-500 text-white'
                : 'bg-purple-400 border-purple-500 text-white'
            }`}
            style={{ width: CHAIR_SIZE, height: CHAIR_SIZE }}
            title={`${activeGuest.firstName} ${activeGuest.lastName}`}
          >
            <span className="text-[10px] leading-tight truncate max-w-[50px]">{activeGuest.firstName}</span>
            <span className="text-[9px] leading-tight opacity-80">{activeGuest.lastName[0]}.</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// Droppable chair on the venue canvas
function VenueChair({
  tableId,
  seatIndex,
  guest,
  x,
  y,
  isDragActive,
}: {
  tableId: string;
  seatIndex: number;
  guest: Guest | undefined;
  x: number;
  y: number;
  isDragActive: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `table-${tableId}-seat-${seatIndex}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`absolute rounded-full border flex flex-col items-center justify-center transition-all overflow-hidden ${
        isOver
          ? 'bg-rose-400 border-rose-500 ring-2 ring-rose-300 scale-110'
          : guest
          ? 'bg-rose-400 border-rose-500 text-white'
          : isDragActive
          ? 'bg-rose-50 border-rose-300 scale-105'
          : 'bg-white border-stone-300'
      }`}
      style={{ left: x, top: y, width: CHAIR_SIZE, height: CHAIR_SIZE }}
      title={
        guest
          ? `${guest.firstName} ${guest.lastName} (Seat ${seatIndex + 1})`
          : `Seat ${seatIndex + 1}`
      }
    >
      {guest ? (
        <>
          <span className="text-[10px] leading-tight font-medium truncate max-w-[50px] text-center">
            {guest.firstName}
          </span>
          <span className="text-[9px] leading-tight opacity-80 truncate max-w-[50px] text-center">
            {guest.lastName[0]}.
          </span>
        </>
      ) : (
        <span className="text-[10px] text-stone-400">{seatIndex + 1}</span>
      )}
    </div>
  );
}

// Draggable guest in the venue sidebar
function VenueDraggableGuest({ guest }: { guest: Guest }) {
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
      className={`flex items-center gap-1 px-2 py-1 rounded border border-l-4 ${sideColor} bg-white text-[11px] cursor-grab hover:shadow-sm transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <span className="truncate">
        {guest.firstName} {guest.lastName[0]}.
      </span>
    </div>
  );
}
