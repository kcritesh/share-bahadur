"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { 
  Search, 
  SortAsc, 
  SortDesc,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  X,
  Download,
  Trash2,
  Check,
  Bell,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import WatchlistButton from "./WatchlistButton";
import QuickAlertModal from "./QuickAlertModal";
import { toast } from "sonner";
import { removeFromWatchlist } from "@/lib/actions/watchlist.actions";

type WatchlistManagerProps = {
  initialItems: StockWithData[];
  news?: MarketNewsArticle[];
};

type SortField = 'symbol' | 'price' | 'change' | 'marketCap' | 'addedAt';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'all' | 'gainers' | 'losers';

export default function WatchlistManager({ initialItems, news = [] }: WatchlistManagerProps) {
  const [items, setItems] = useState<StockWithData[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>('addedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [alertModalStock, setAlertModalStock] = useState<{
    symbol: string;
    company: string;
    currentPrice: number;
  } | null>(null);

  // Calculate performance metrics
  const metrics = useMemo(() => {
    const gainers = items.filter(item => (item.changePercent ?? 0) > 0).length;
    const losers = items.filter(item => (item.changePercent ?? 0) < 0).length;
    const unchanged = items.filter(item => (item.changePercent ?? 0) === 0).length;
    const avgChange = items.length > 0 
      ? items.reduce((sum, item) => sum + (item.changePercent ?? 0), 0) / items.length 
      : 0;
    
    // Calculate average change since added (portfolio performance)
    const itemsWithAddedPrice = items.filter(item => item.changeSinceAdded !== undefined);
    const avgChangeSinceAdded = itemsWithAddedPrice.length > 0
      ? itemsWithAddedPrice.reduce((sum, item) => sum + (item.changeSinceAdded ?? 0), 0) / itemsWithAddedPrice.length
      : 0;
    
    return { gainers, losers, unchanged, avgChange, avgChangeSinceAdded, total: items.length };
  }, [items]);

  // Filter and sort items
  const displayedItems = useMemo(() => {
    let filtered = items;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.symbol.toLowerCase().includes(query) ||
        item.company.toLowerCase().includes(query)
      );
    }

    // Apply view mode filter
    if (viewMode === 'gainers') {
      filtered = filtered.filter(item => (item.changePercent ?? 0) > 0);
    } else if (viewMode === 'losers') {
      filtered = filtered.filter(item => (item.changePercent ?? 0) < 0);
    }

    // Sort items
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'price':
          comparison = (a.currentPrice ?? 0) - (b.currentPrice ?? 0);
          break;
        case 'change':
          comparison = (a.changePercent ?? 0) - (b.changePercent ?? 0);
          break;
        case 'marketCap':
          // Extract numeric value from market cap string
          const aMarketCap = parseFloat(a.marketCap?.replace(/[$B,]/g, '') ?? '0');
          const bMarketCap = parseFloat(b.marketCap?.replace(/[$B,]/g, '') ?? '0');
          comparison = aMarketCap - bMarketCap;
          break;
        case 'addedAt':
          comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [items, searchQuery, sortField, sortDirection, viewMode]);

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Export to CSV
  const handleExport = () => {
    const csvContent = [
      ['Symbol', 'Company', 'Current Price', 'Change %', 'Market Cap', 'Added Date'].join(','),
      ...displayedItems.map(item => [
        item.symbol,
        `"${item.company}"`,
        item.currentPrice ?? 'N/A',
        item.changePercent ?? 'N/A',
        item.marketCap ?? 'N/A',
        new Date(item.addedAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watchlist-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Watchlist exported successfully');
  };

  // Toggle item selection
  const toggleSelection = (symbol: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(symbol)) {
      newSelected.delete(symbol);
    } else {
      newSelected.add(symbol);
    }
    setSelectedItems(newSelected);
  };

  // Select all/none
  const handleSelectAll = () => {
    if (selectedItems.size === displayedItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(displayedItems.map(item => item.symbol)));
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      toast.error('No items selected');
      return;
    }

    startTransition(async () => {
      const symbols = Array.from(selectedItems);
      const results = await Promise.all(
        symbols.map(symbol => removeFromWatchlist(symbol))
      );

      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;

      if (successful > 0) {
        setItems(items.filter(item => !selectedItems.has(item.symbol)));
        setSelectedItems(new Set());
        toast.success(`${successful} stock${successful > 1 ? 's' : ''} removed from watchlist`);
      }

      if (failed > 0) {
        toast.error(`Failed to remove ${failed} stock${failed > 1 ? 's' : ''}`);
      }
    });
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 text-sm font-medium transition-colors ${
        sortField === field 
          ? 'text-[#0B3D66]' 
          : 'text-[#6C757D] hover:text-[#212529]'
      }`}
    >
      {label}
      {sortField === field && (
        sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#6C757D] mb-1">Total Stocks</p>
              <p className="text-2xl font-bold text-[#212529]">{metrics.total}</p>
            </div>
            <DollarSign className="w-8 h-8 text-[#0B3D66] opacity-50" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#6C757D] mb-1">Gainers</p>
              <p className="text-2xl font-bold text-green-600">{metrics.gainers}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#6C757D] mb-1">Losers</p>
              <p className="text-2xl font-bold text-red-600">{metrics.losers}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600 opacity-50" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#6C757D] mb-1">Daily Avg</p>
              <p className={`text-2xl font-bold ${
                metrics.avgChange > 0 ? 'text-green-600' : 
                metrics.avgChange < 0 ? 'text-red-600' : 
                'text-[#6C757D]'
              }`}>
                {metrics.avgChange > 0 ? '+' : ''}{metrics.avgChange.toFixed(2)}%
              </p>
            </div>
            <Calendar className="w-8 h-8 text-[#0B3D66] opacity-50" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#6C757D] mb-1">Portfolio Return</p>
              <p className={`text-2xl font-bold ${
                metrics.avgChangeSinceAdded > 0 ? 'text-green-600' : 
                metrics.avgChangeSinceAdded < 0 ? 'text-red-600' : 
                'text-[#6C757D]'
              }`}>
                {metrics.avgChangeSinceAdded > 0 ? '+' : ''}{metrics.avgChangeSinceAdded.toFixed(2)}%
              </p>
            </div>
            {metrics.avgChangeSinceAdded > 0 ? (
              <TrendingUp className="w-8 h-8 text-green-600 opacity-50" />
            ) : metrics.avgChangeSinceAdded < 0 ? (
              <TrendingDown className="w-8 h-8 text-red-600 opacity-50" />
            ) : (
              <DollarSign className="w-8 h-8 text-[#6C757D] opacity-50" />
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6C757D]" />
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3D66] focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6C757D] hover:text-[#212529]"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'all'
                  ? 'bg-[#0B3D66] text-white'
                  : 'bg-gray-100 text-[#6C757D] hover:bg-gray-200'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setViewMode('gainers')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'gainers'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-[#6C757D] hover:bg-gray-200'
              }`}
            >
              Gainers ({metrics.gainers})
            </button>
            <button
              onClick={() => setViewMode('losers')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'losers'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-[#6C757D] hover:bg-gray-200'
              }`}
            >
              Losers ({metrics.losers})
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#212529] rounded-lg font-medium transition-colors"
              title="Export to CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            
            {selectedItems.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Remove ({selectedItems.size})
              </button>
            )}
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200">
          <span className="text-sm text-[#6C757D] font-medium">Sort by:</span>
          <SortButton field="symbol" label="Symbol" />
          <SortButton field="price" label="Price" />
          <SortButton field="change" label="Change" />
          <SortButton field="marketCap" label="Market Cap" />
          <SortButton field="addedAt" label="Date Added" />
        </div>

        {/* Bulk Selection */}
        {displayedItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm text-[#0B3D66] hover:text-[#0B3D66]/80 font-medium"
            >
              {selectedItems.size === displayedItems.length ? (
                <>
                  <X className="w-4 h-4" />
                  Deselect All
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Select All ({displayedItems.length})
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Stock List */}
      <div className="grid grid-cols-1 gap-4">
        {displayedItems.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-[#6C757D]">
              {searchQuery 
                ? `No stocks found matching "${searchQuery}"`
                : viewMode === 'gainers'
                ? 'No gainers in your watchlist'
                : viewMode === 'losers'
                ? 'No losers in your watchlist'
                : 'No stocks in your watchlist'
              }
            </p>
          </div>
        ) : (
          displayedItems.map((item) => (
            <div
              key={item.symbol}
              className={`bg-white border rounded-lg p-6 hover:shadow-lg transition-all ${
                selectedItems.has(item.symbol) 
                  ? 'border-[#0B3D66] shadow-md' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Selection Checkbox */}
                <div className="flex items-start md:items-center gap-4 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.symbol)}
                    onChange={() => toggleSelection(item.symbol)}
                    className="w-5 h-5 mt-1 md:mt-0 text-[#0B3D66] rounded focus:ring-[#0B3D66] cursor-pointer"
                  />

                  {/* Stock Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link 
                          href={`/stocks/${item.symbol.toLowerCase()}`}
                          className="text-2xl font-bold text-[#212529] hover:text-[#0B3D66] transition-colors"
                        >
                          {item.symbol}
                        </Link>
                        <p className="text-[#6C757D] mt-1">{item.company}</p>
                      </div>
                    </div>

                    {/* Stock Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-[#6C757D] mb-1">Current Price</p>
                        <p className="text-lg font-semibold text-[#212529]">
                          {item.priceFormatted}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-[#6C757D] mb-1">Daily Change</p>
                        <div className="flex items-center gap-1">
                          {item.changePercent !== undefined && item.changePercent > 0 ? (
                            <ChevronUp className="w-4 h-4 text-green-600" />
                          ) : item.changePercent !== undefined && item.changePercent < 0 ? (
                            <ChevronDown className="w-4 h-4 text-red-600" />
                          ) : null}
                          <p
                            className={`text-lg font-semibold ${
                              item.changePercent !== undefined && item.changePercent > 0
                                ? "text-green-600"
                                : item.changePercent !== undefined && item.changePercent < 0
                                ? "text-red-600"
                                : "text-[#6C757D]"
                            }`}
                          >
                            {item.changeFormatted}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-[#6C757D] mb-1">Since Added</p>
                        <div className="flex items-center gap-1">
                          {item.changeSinceAdded !== undefined && item.changeSinceAdded > 0 ? (
                            <ChevronUp className="w-4 h-4 text-green-600" />
                          ) : item.changeSinceAdded !== undefined && item.changeSinceAdded < 0 ? (
                            <ChevronDown className="w-4 h-4 text-red-600" />
                          ) : null}
                          <p
                            className={`text-lg font-semibold ${
                              item.changeSinceAdded !== undefined && item.changeSinceAdded > 0
                                ? "text-green-600"
                                : item.changeSinceAdded !== undefined && item.changeSinceAdded < 0
                                ? "text-red-600"
                                : "text-[#6C757D]"
                            }`}
                          >
                            {item.changeSinceAddedFormatted}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-[#6C757D] mb-1">Market Cap</p>
                        <p className="text-lg font-semibold text-[#212529]">
                          {item.marketCap}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#6C757D] mb-1">Added</p>
                        <p className="text-sm text-[#6C757D]">
                          {new Date(item.addedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 md:min-w-[200px]">
                  <Link
                    href={`/stocks/${item.symbol.toLowerCase()}`}
                    className="bg-[#0B3D66] hover:bg-[#0B3D66]/90 text-white text-center px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => setAlertModalStock({
                      symbol: item.symbol,
                      company: item.company,
                      currentPrice: item.currentPrice ?? 0
                    })}
                    className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                    disabled={!item.currentPrice}
                  >
                    <Bell className="w-4 h-4" />
                    Set Alert
                  </button>
                  <div className="w-full">
                    <WatchlistButton
                      symbol={item.symbol}
                      company={item.company}
                      isInWatchlist={true}
                      showTrashIcon={true}
                      onWatchlistChange={(symbol, isAdded) => {
                        if (!isAdded) {
                          setItems(items.filter(i => i.symbol !== symbol));
                          setSelectedItems(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(symbol);
                            return newSet;
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* News Section */}
      {news.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-[#212529] mb-4">Latest News</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.slice(0, 6).map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {article.image && (
                  <div className="relative h-40 overflow-hidden bg-gray-100">
                    <img 
                      src={article.image} 
                      alt={article.headline}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-xs text-[#0B3D66] font-semibold mb-2">
                    {article.related || article.source}
                  </p>
                  <h3 className="text-sm font-semibold text-[#212529] line-clamp-2 group-hover:text-[#0B3D66] transition-colors">
                    {article.headline}
                  </h3>
                  <p className="text-xs text-[#6C757D] mt-2">
                    {new Date(article.datetime * 1000).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Quick Alert Modal */}
      {alertModalStock && (
        <QuickAlertModal
          stock={alertModalStock}
          isOpen={!!alertModalStock}
          onClose={() => setAlertModalStock(null)}
        />
      )}
    </div>
  );
}

