'use client';

import React, { useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { MapPin, Check, X, Plus } from 'lucide-react';
import { DeliveryAddress } from '@/types/cart';

const PRESET_ADDRESSES: DeliveryAddress[] = [
  {
    id: 'addr-blr',
    label: 'Home (Bengaluru)',
    name: 'Ananya Sharma',
    street: 'Flat 402, Green Glen Layout, Bellandur',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560103',
    phone: '+91 98765 43210',
    isDefault: true,
  },
  {
    id: 'addr-mum',
    label: 'Work (Mumbai)',
    name: 'Ananya Sharma',
    street: 'Tower B, One International Center, Lower Parel',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400013',
    phone: '+91 98765 43210',
  },
  {
    id: 'addr-del',
    label: 'Parents (New Delhi)',
    name: 'Rajesh Sharma',
    street: 'C-14, Hauz Khas Enclave',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110016',
    phone: '+91 98110 54321',
  },
];

export function DeliveryModal() {
  const { isDeliveryAddressOpen, setDeliveryAddressOpen, showToast } = useUIStore();
  const { deliveryAddress, setDeliveryAddress } = useCartStore();

  const [addresses, setAddresses] = useState<DeliveryAddress[]>(PRESET_ADDRESSES);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState('Other');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('Bengaluru');
  const [newPincode, setNewPincode] = useState('560001');

  if (!isDeliveryAddressOpen) return null;

  const handleSelect = (addr: DeliveryAddress) => {
    setDeliveryAddress(addr);
    showToast(`Delivery location set to ${addr.label}`, 'success');
    setDeliveryAddressOpen(false);
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet.trim()) return;

    const newAddr: DeliveryAddress = {
      id: `addr-${Date.now()}`,
      label: newLabel,
      name: 'Ananya Sharma',
      street: newStreet,
      city: newCity,
      state: 'Karnataka',
      pincode: newPincode,
      phone: '+91 98765 43210',
    };

    setAddresses([newAddr, ...addresses]);
    handleSelect(newAddr);
    setIsAddingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Select Delivery Location</h3>
              <p className="text-xs text-slate-400">Delivering in 30 minutes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDeliveryAddressOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Addresses List */}
        <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
          {!isAddingNew ? (
            <>
              {addresses.map((addr) => {
                const isSelected = deliveryAddress.id === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => handleSelect(addr)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-white">{addr.label}</span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                          <Check className="w-3.5 h-3.5" /> Selected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{addr.street}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {addr.city}, {addr.pincode}
                    </p>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:border-emerald-500 flex items-center justify-center gap-2 transition-colors mt-2"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                Add New Delivery Address
              </button>
            </>
          ) : (
            <form onSubmit={handleSaveNew} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Address Label
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Home, Studio, Gym"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Street / Flat / Apartment
                </label>
                <input
                  type="text"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  placeholder="Flat no, building, street name"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">City</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Pincode</label>
                  <input
                    type="text"
                    value={newPincode}
                    onChange={(e) => setNewPincode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 shadow-md"
                >
                  Save & Deliver Here
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
