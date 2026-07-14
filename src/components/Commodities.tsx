import React, { useState } from 'react';
import { 
  Plus, 
  ShoppingBag, 
  Tag, 
  Trash2, 
  Scale, 
  Edit2, 
  AlertCircle 
} from 'lucide-react';
import { Commodity } from '../types';

interface CommoditiesProps {
  commodities: Commodity[];
  onAddCommodity: (commodity: Omit<Commodity, 'id'>) => void;
  onEditCommodity: (commodity: Commodity) => void;
  onDeleteCommodity: (id: string) => void;
}

export default function Commodities({
  commodities,
  onAddCommodity,
  onEditCommodity,
  onDeleteCommodity,
}: CommoditiesProps) {
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCommodityId, setEditingCommodityId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [defaultUnit, setDefaultUnit] = useState('Bag (50kg)');
  const [defaultPrice, setDefaultPrice] = useState<number | ''>(30000);

  // Default suggested standard units
  const standardUnits = [
    'Bag (50kg)',
    'Bag (100kg)',
    'Paint Bucket',
    'Mudu',
    'Derica',
    'Cup'
  ];

  // Form Submitters
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !defaultUnit.trim()) return;
    onAddCommodity({
      name,
      defaultUnit,
      defaultPrice: Number(defaultPrice) || 0,
    });
    setName('');
    setDefaultUnit('Bag (50kg)');
    setDefaultPrice(30000);
    setShowAddForm(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommodityId || !name.trim() || !defaultUnit.trim()) return;
    onEditCommodity({
      id: editingCommodityId,
      name,
      defaultUnit,
      defaultPrice: Number(defaultPrice) || 0,
    });
    setName('');
    setDefaultUnit('Bag (50kg)');
    setDefaultPrice(30000);
    setEditingCommodityId(null);
  };

  const startEdit = (com: Commodity) => {
    setEditingCommodityId(com.id);
    setName(com.name);
    setDefaultUnit(com.defaultUnit);
    setDefaultPrice(com.defaultPrice);
    setShowAddForm(false);
  };

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div id="commodities-view-container" className="space-y-6">
      
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">Commodity Settings</h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage commodities and standard pricing models.</p>
        </div>

        {!showAddForm && !editingCommodityId && (
          <button
            id="add-commodity-trigger-btn"
            onClick={() => {
              setName('');
              setDefaultUnit('Bag (50kg)');
              setDefaultPrice(30000);
              setShowAddForm(true);
            }}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Commodity</span>
          </button>
        )}
      </div>

      {/* Add / Edit Form Block */}
      {(showAddForm || editingCommodityId) && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              {editingCommodityId ? 'Edit Commodity details' : 'Register New Commodity'}
            </h2>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingCommodityId(null);
              }}
              className="text-slate-400 hover:text-slate-600 font-bold text-xs"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={editingCommodityId ? handleEditSubmit : handleAddSubmit} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-500 mb-1">Commodity Name *</label>
              <input
                id="com-form-name"
                type="text"
                required
                placeholder="e.g. Yellow Garri (Premium)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1">Default Unit *</label>
                <div className="relative">
                  <input
                    id="com-form-unit"
                    type="text"
                    required
                    placeholder="e.g. Bag (50kg), Mudu"
                    value={defaultUnit}
                    onChange={(e) => setDefaultUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none"
                  />
                  
                  {/* Standard Units Suggestion pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {standardUnits.map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setDefaultUnit(u)}
                        className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border transition ${
                          defaultUnit === u ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Default Market Price (₦) *</label>
                <input
                  id="com-form-price"
                  type="number"
                  required
                  placeholder="e.g. 35000"
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow"
            >
              {editingCommodityId ? 'Save Commodity Changes' : 'Create Commodity'}
            </button>
          </form>
        </div>
      )}

      {/* Grid of registered commodities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {commodities.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl py-12 text-center border border-slate-100 shadow-sm">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h3 className="text-slate-700 font-bold text-sm">No commodities registered</h3>
            <p className="text-slate-400 text-xs mt-1">Add commodities above to enable transactions logging.</p>
          </div>
        ) : (
          commodities.map((com) => (
            <div
              key={com.id}
              id={`commodity-card-${com.id}`}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">{com.name}</h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 mt-0.5">
                      <Scale className="w-3 h-3" />
                      <span>{com.defaultUnit}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    id={`edit-com-btn-${com.id}`}
                    onClick={() => startEdit(com)}
                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 cursor-pointer transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  
                  <button
                    id={`delete-com-btn-${com.id}`}
                    onClick={() => setDeleteConfirmId(com.id)}
                    className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="pt-3.5 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Default Price:</span>
                </span>
                <span className="text-sm font-black text-slate-800">
                  {formatNaira(com.defaultPrice)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-100 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-extrabold text-sm text-slate-900">Delete Commodity?</h3>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Are you sure you want to delete <strong>{commodities.find(c => c.id === deleteConfirmId)?.name}</strong>? This will remove its references and catalog profile.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCommodity(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
