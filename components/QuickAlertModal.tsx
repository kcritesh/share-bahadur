"use client";

import React, { useState, useTransition } from "react";
import { X, Bell, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

type QuickAlertModalProps = {
  stock: {
    symbol: string;
    company: string;
    currentPrice: number;
  };
  isOpen: boolean;
  onClose: () => void;
};

export default function QuickAlertModal({ stock, isOpen, onClose }: QuickAlertModalProps) {
  const [alertType, setAlertType] = useState<'upper' | 'lower'>('upper');
  const [threshold, setThreshold] = useState<string>(stock.currentPrice.toFixed(2));
  const [alertName, setAlertName] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const thresholdNum = parseFloat(threshold);
    if (isNaN(thresholdNum) || thresholdNum <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (!alertName.trim()) {
      toast.error('Please enter an alert name');
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: stock.symbol,
            company: stock.company,
            alertName: alertName.trim(),
            alertType,
            threshold: thresholdNum,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success(`Alert created for ${stock.symbol}`);
          onClose();
        } else {
          toast.error(data.message || 'Failed to create alert');
        }
      } catch (error) {
        console.error('Error creating alert:', error);
        toast.error('Failed to create alert');
      }
    });
  };

  const suggestedPrices = {
    upper: [
      { label: '+5%', value: (stock.currentPrice * 1.05).toFixed(2) },
      { label: '+10%', value: (stock.currentPrice * 1.10).toFixed(2) },
      { label: '+20%', value: (stock.currentPrice * 1.20).toFixed(2) },
    ],
    lower: [
      { label: '-5%', value: (stock.currentPrice * 0.95).toFixed(2) },
      { label: '-10%', value: (stock.currentPrice * 0.90).toFixed(2) },
      { label: '-20%', value: (stock.currentPrice * 0.80).toFixed(2) },
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#0B3D66]" />
            <h2 className="text-xl font-bold text-[#212529]">Set Price Alert</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#6C757D] hover:text-[#212529] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-lg font-semibold text-[#212529]">{stock.symbol}</p>
          <p className="text-sm text-[#6C757D]">{stock.company}</p>
          <p className="text-sm text-[#6C757D] mt-1">
            Current Price: <span className="font-semibold text-[#212529]">${stock.currentPrice.toFixed(2)}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Alert Name */}
          <div>
            <label className="block text-sm font-medium text-[#212529] mb-2">
              Alert Name
            </label>
            <input
              type="text"
              value={alertName}
              onChange={(e) => setAlertName(e.target.value)}
              placeholder="e.g., Buy opportunity, Take profit"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3D66] focus:border-transparent"
              required
            />
          </div>

          {/* Alert Type */}
          <div>
            <label className="block text-sm font-medium text-[#212529] mb-2">
              Alert Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAlertType('upper')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  alertType === 'upper'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-[#6C757D] hover:bg-gray-200'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Price Above
              </button>
              <button
                type="button"
                onClick={() => setAlertType('lower')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  alertType === 'lower'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-[#6C757D] hover:bg-gray-200'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                Price Below
              </button>
            </div>
          </div>

          {/* Threshold Price */}
          <div>
            <label className="block text-sm font-medium text-[#212529] mb-2">
              Target Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3D66] focus:border-transparent"
              required
            />
          </div>

          {/* Quick Suggestions */}
          <div>
            <label className="block text-sm font-medium text-[#212529] mb-2">
              Quick Suggestions
            </label>
            <div className="flex gap-2">
              {suggestedPrices[alertType].map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  onClick={() => setThreshold(suggestion.value)}
                  className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-[#212529] rounded-lg text-sm font-medium transition-colors"
                >
                  {suggestion.label}
                  <div className="text-xs text-[#6C757D]">${suggestion.value}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#212529] rounded-lg font-semibold transition-colors"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#0B3D66] hover:bg-[#0B3D66]/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isPending}
            >
              {isPending ? 'Creating...' : 'Create Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

