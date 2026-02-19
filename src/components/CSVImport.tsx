import { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { useStore } from '../store/useStore';

interface Props {
  onClose: () => void;
}

export function CSVImport({ onClose }: Props) {
  const { importGuestsCSV } = useStore();
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState<string[][]>([]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      parsePreview(text);
    };
    reader.readAsText(file);
  };

  const parsePreview = (text: string) => {
    const lines = text.trim().split('\n').slice(0, 6);
    setPreview(lines.map((l) => l.split(',').map((c) => c.trim())));
  };

  const handleTextChange = (text: string) => {
    setCsvText(text);
    if (text.trim()) parsePreview(text);
    else setPreview([]);
  };

  const handleImport = () => {
    if (!csvText.trim()) return;
    importGuestsCSV(csvText);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Import Guest List (CSV)</h2>
          <button className="btn-ghost p-1" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="bg-stone-50 rounded-lg p-4 mb-4 text-sm text-stone-600">
          <p className="font-medium mb-1">Expected CSV format:</p>
          <code className="text-xs block bg-white rounded p-2 text-stone-700">
            First Name,Last Name,Family,Side,Meal,RSVP<br />
            John,Smith,Smith,groom,standard,accepted<br />
            Jane,Smith,Smith,groom,vegetarian,accepted
          </code>
          <p className="text-xs mt-2 text-stone-400">
            Required columns: First Name, Last Name. Optional: Family, Side (bride/groom/mutual), Meal, RSVP.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="btn-secondary inline-flex cursor-pointer">
              <Upload size={14} /> Choose CSV File
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
            </label>
          </div>

          <div>
            <label className="label">Or paste CSV data</label>
            <textarea
              className="input font-mono text-xs"
              rows={6}
              value={csvText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="First Name,Last Name,Family,Side,Meal,RSVP"
            />
          </div>

          {preview.length > 0 && (
            <div>
              <label className="label">Preview</label>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      {preview[0]?.map((h, i) => (
                        <th key={i} className="text-left p-2 bg-stone-100 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(1).map((row, i) => (
                      <tr key={i} className="border-t border-stone-100">
                        {row.map((cell, j) => (
                          <td key={j} className="p-2 text-stone-600">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleImport}
              disabled={!csvText.trim()}
            >
              <FileText size={14} /> Import Guests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
