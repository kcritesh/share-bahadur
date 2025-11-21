'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import TradingViewWidget from '@/components/TradingViewWidget';

interface Indicator {
  id: string;
  name: string;
  purpose: string;
  studyId: string;
}

interface TechnicalIndicatorsProps {
  symbol: string;
  className?: string;
}

const indicators: Indicator[] = [
  { 
    id: 'ema', 
    name: 'EMA (12/26)', 
    purpose: 'Trend direction',
    studyId: 'MAExp@tv-basicstudies'
  },
  { 
    id: 'macd', 
    name: 'MACD', 
    purpose: 'Momentum & crossover',
    studyId: 'MACD@tv-basicstudies'
  },
  { 
    id: 'rsi', 
    name: 'RSI (14)', 
    purpose: 'Overbought/Oversold',
    studyId: 'RSI@tv-basicstudies'
  },
  { 
    id: 'bb', 
    name: 'Bollinger Bands', 
    purpose: 'Volatility',
    studyId: 'BB@tv-basicstudies'
  },
  { 
    id: 'adx', 
    name: 'ADX', 
    purpose: 'Trend strength',
    studyId: 'ADX@tv-basicstudies'
  },
  { 
    id: 'obv', 
    name: 'OBV', 
    purpose: 'Volume confirmation',
    studyId: 'OBV@tv-basicstudies'
  },
];

const TechnicalIndicators = ({ symbol, className }: TechnicalIndicatorsProps) => {
  const [activeIndicators, setActiveIndicators] = useState<Set<string>>(new Set());
  const scriptUrl = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';

  const toggleIndicator = (indicatorId: string) => {
    setActiveIndicators(prev => {
      const newSet = new Set(prev);
      if (newSet.has(indicatorId)) {
        newSet.delete(indicatorId);
      } else {
        newSet.add(indicatorId);
      }
      return newSet;
    });
  };

  const getChartConfig = () => {
    const studies = Array.from(activeIndicators).map(id => {
      const indicator = indicators.find(ind => ind.id === id);
      return indicator ? { id: indicator.studyId } : null;
    }).filter(Boolean);

    return {
      allow_symbol_change: false,
      calendar: false,
      details: true,
      hide_side_toolbar: true,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      hotlist: false,
      interval: 'D',
      locale: 'en',
      save_image: false,
      style: 1,
      symbol: symbol.toUpperCase(),
      theme: 'light',
      timezone: 'Etc/UTC',
      backgroundColor: '#FFFFFF',
      gridColor: '#E5E7EB',
      watchlist: [],
      withdateranges: false,
      compareSymbols: [],
      studies,
      width: '100%',
      height: 600,
    };
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Indicator Selector */}
      <div className="mb-4 p-4 rounded-lg border bg-card shadow-sm">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">
          Technical Indicators
        </h3>
        <div className="flex flex-wrap gap-2">
          {indicators.map((indicator) => {
            const isActive = activeIndicators.has(indicator.id);
            return (
              <button
                key={indicator.id}
                onClick={() => toggleIndicator(indicator.id)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  'border focus:outline-none focus:ring-2 focus:ring-ring/50',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                    : 'bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'
                )}
                title={indicator.purpose}
              >
                {indicator.name}
              </button>
            );
          })}
        </div>
        {activeIndicators.size > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {activeIndicators.size} indicator{activeIndicators.size !== 1 ? 's' : ''} active
          </p>
        )}
      </div>

      {/* Chart with Indicators */}
      <TradingViewWidget
        key={JSON.stringify(Array.from(activeIndicators))}
        scriptUrl={scriptUrl}
        config={getChartConfig()}
        className="custom-chart"
        height={600}
      />
    </div>
  );
};

export default TechnicalIndicators;

