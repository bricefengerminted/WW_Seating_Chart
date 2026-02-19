import { useState, useRef, useCallback } from 'react';
import { Plus, Trash2, RotateCw, Settings, Minus } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Table, TableShape } from '../types';

const TABLE_PRESETS: { label: string; shape: TableShape; seats: number }[] = [
  { label: 'Round (8)', shape: 'round', seats: 8 },
  { label: 'Round (10)', shape: 'round', seats: 10 },
  { label: 'Round (12)', shape: 'round', seats: 12 },
  { label: 'Rectangular (6)', shape: 'rectangular', seats: 6 },
  { label: 'Rectangular (8)', shape: 'rectangular', seats: 8 },
  { label: 'Long (10)', shape: 'long', seats: 10 },
  { label: 'Long (20)', shape: 'long', seats: 20 },
];

export function VenueDesigner() {
  const { tables, addTable, updateTable, removeTable, guests, venue, updateVenue } = useStore();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedTableData = tables.find((t) => t.id === selectedTable);

  const getGuestsAtTable = (tableId: string) =>
    guests.filter((g) => g.tableId === tableId);

  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    e.stopPropagation();
    const table = tables.find((t) => t.id === tableId);
    if (!table || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left - table.x,
      y: e.clientY - rect.top - table.y,
    });
    setDraggingTable(tableId);
    setSelectedTable(tableId);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingTable || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(venue.width - 40, e.clientX - rect.left - dragOffset.x));
      const y = Math.max(0, Math.min(venue.height - 40, e.clientY - rect.top - dragOffset.y));
      updateTable(draggingTable, { x, y });
    },
    [draggingTable, dragOffset, updateTable, venue]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingTable(null);
  }, []);

  const handleCanvasClick = () => {
    setSelectedTable(null);
  };

  const getTableDimensions = (table: Table) => {
    switch (table.shape) {
      case 'round':
        return { width: 80 + table.seats * 6, height: 80 + table.seats * 6 };
      case 'rectangular':
        return { width: 100 + table.seats * 10, height: 70 };
      case 'long':
        return { width: 60 + table.seats * 16, height: 60 };
    }
  };

  return (
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
        {/* Canvas */}
        <div className="flex-1 overflow-auto">
          <div
            ref={canvasRef}
            className="venue-canvas relative bg-white rounded-xl border-2 border-dashed border-stone-300"
            style={{ width: venue.width, height: venue.height, minWidth: venue.width }}
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

                  {/* Seat indicators around the table */}
                  {table.shape === 'round' &&
                    Array.from({ length: table.seats }).map((_, i) => {
                      const angle = (i * 360) / table.seats - 90;
                      const rad = (angle * Math.PI) / 180;
                      const rx = dims.width / 2 + 4;
                      const ry = dims.height / 2 + 4;
                      const cx = dims.width / 2 + rx * Math.cos(rad);
                      const cy = dims.height / 2 + ry * Math.sin(rad);
                      const occupied = seated.find((g) => g.seatIndex === i);
                      return (
                        <div
                          key={i}
                          className={`absolute w-4 h-4 rounded-full border text-[7px] flex items-center justify-center ${
                            occupied
                              ? 'bg-rose-400 border-rose-500 text-white'
                              : 'bg-white border-stone-300'
                          }`}
                          style={{
                            left: cx - 8,
                            top: cy - 8,
                          }}
                          title={occupied ? `${occupied.firstName} ${occupied.lastName}` : `Seat ${i + 1}`}
                        >
                          {occupied ? occupied.firstName[0] : ''}
                        </div>
                      );
                    })}
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

        {/* Table properties panel */}
        {selectedTableData && (
          <div className="w-64 card p-4 space-y-4 self-start">
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
  );
}
