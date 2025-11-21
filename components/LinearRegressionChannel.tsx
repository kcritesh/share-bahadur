'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Activity, BarChart3, Target, Calendar } from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: 30, label: '30D', description: '1 Month' },
  { value: 60, label: '60D', description: '2 Months' },
  { value: 90, label: '90D', description: '3 Months' },
  { value: 180, label: '180D', description: '6 Months' },
  { value: 365, label: '1Y', description: '1 Year' },
];

const LinearRegressionChannel = ({ symbol, className }: LinearRegressionChannelProps) => {
  const [data, setData] = useState<RegressionChannelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(90);

  useEffect(() => {
    const fetchRegressionData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/ml/regression-channel?symbol=${encodeURIComponent(symbol)}&days=${selectedPeriod}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch regression data');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching regression channel data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load regression analysis');
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchRegressionData();
    }
  }, [symbol, selectedPeriod]);

  // Loading state
  if (loading) {
    return (
      <div className={cn('w-full', className)}>
        <div className="rounded-xl border-2 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 animate-pulse">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-card-foreground">
                Linear Regression Channel
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Machine learning-powered price prediction model
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-xl opacity-30 animate-pulse" />
              <Activity className="relative h-16 w-16 text-primary animate-spin" />
            </div>
            <p className="text-base font-semibold text-card-foreground mt-6">
              Analyzing {symbol} price data...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Our AI is crunching the numbers for you
            </p>
            <div className="mt-4 flex gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('w-full', className)}>
        <div className="rounded-xl border-2 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-card-foreground">
                Linear Regression Channel
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Machine learning-powered price prediction model
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-4 rounded-full bg-red-100 dark:bg-red-950/30 mb-4">
              <div className="text-4xl">⚠️</div>
            </div>
            <p className="text-lg font-semibold text-destructive mb-2">Analysis Error</p>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">{error}</p>
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-900 dark:text-amber-200">
                This could be due to API rate limits or insufficient data. Please try again later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data) {
    return null;
  }

  // Get signal styling
  const getSignalStyle = (action: 'BUY' | 'SELL' | 'HOLD') => {
    switch (action) {
      case 'BUY':
        return {
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-700 dark:text-green-400',
          icon: <TrendingUp className="h-5 w-5" />,
        };
      case 'SELL':
        return {
          bgColor: 'bg-red-50 dark:bg-red-950/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-700 dark:text-red-400',
          icon: <TrendingDown className="h-5 w-5" />,
        };
      case 'HOLD':
        return {
          bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-700 dark:text-yellow-400',
          icon: <Minus className="h-5 w-5" />,
        };
    }
  };

  const signalStyle = getSignalStyle(data.signal.action);

  return (
    <div className={cn('w-full', className)}>
      <div className="rounded-xl border-2 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-card-foreground">
                Linear Regression Channel
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Machine learning-powered price prediction model
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Period Selector */}
            <div className="flex items-center gap-2 p-1 rounded-lg bg-muted/50 border border-border">
              <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
              {PERIOD_OPTIONS.map((period) => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                    selectedPeriod === period.value
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-muted hover:text-card-foreground'
                  )}
                  title={period.description}
                >
                  {period.label}
                </button>
              ))}
            </div>
            {/* Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">
                {data.dataPoints} days analyzed
              </span>
            </div>
          </div>
        </div>

        {/* Main Signal Card - Enhanced */}
        <div className={cn(
          'rounded-xl border-2 p-6 mb-6 shadow-lg',
          signalStyle.bgColor,
          signalStyle.borderColor
        )}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={cn('p-3 rounded-xl shadow-md', signalStyle.textColor, 'bg-white/50 dark:bg-black/20')}>
                {signalStyle.icon}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h4 className={cn('text-3xl font-extrabold', signalStyle.textColor)}>
                    {data.signal.action} SIGNAL
                  </h4>
                  <span className={cn(
                    'px-3 py-1 rounded-full text-sm font-bold shadow-sm',
                    signalStyle.textColor,
                    'bg-white/50 dark:bg-black/20'
                  )}>
                    {data.signal.strength.toFixed(0)}% confidence
                  </span>
                </div>
                <p className="text-sm text-card-foreground/80 leading-relaxed max-w-2xl">
                  {data.signal.explanation}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Timeline Info */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-200/50 dark:border-blue-800/50">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-card-foreground mb-1">
                📅 Prediction Timeline: Current Point Analysis
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The <strong className="text-card-foreground">predicted price (${data.currentAnalysis.predictedPrice.toFixed(2)})</strong> represents 
                where the stock <em>should be trading</em> based on the {data.dataPoints}-day regression trend line. 
                This is calculated from historical price movements over the past {data.daysAnalyzed} days. 
                The current price deviation from this prediction helps identify potential trading opportunities.
              </p>
            </div>
          </div>
        </div>

        {/* Price Analysis Grid - Enhanced */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 p-4 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wide">
                Current Price
              </p>
            </div>
            <p className="text-2xl font-extrabold text-card-foreground">
              ${data.currentAnalysis.currentPrice.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Live market price</p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/40 border-2 border-blue-300 dark:border-blue-700 p-4 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold uppercase tracking-wide">
                Predicted
              </p>
            </div>
            <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">
              ${data.currentAnalysis.predictedPrice.toFixed(2)}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1 font-medium">
              AI regression line
            </p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/40 border-2 border-red-300 dark:border-red-700 p-4 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-xs text-red-700 dark:text-red-400 font-semibold uppercase tracking-wide">
                Upper Band
              </p>
            </div>
            <p className="text-2xl font-extrabold text-red-700 dark:text-red-400">
              ${data.currentAnalysis.upperBand.toFixed(2)}
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-1 font-medium">
              {data.channel.distanceFromUpper.toFixed(1)}% above current
            </p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/40 border-2 border-green-300 dark:border-green-700 p-4 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-xs text-green-700 dark:text-green-400 font-semibold uppercase tracking-wide">
                Lower Band
              </p>
            </div>
            <p className="text-2xl font-extrabold text-green-700 dark:text-green-400">
              ${data.currentAnalysis.lowerBand.toFixed(2)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1 font-medium">
              {data.channel.distanceFromLower.toFixed(1)}% below current
            </p>
          </div>
        </div>

        {/* Visual Progress Bar - Price Position */}
        <div className="mb-6 p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-card-foreground">Price Position in Channel</span>
            <span className="text-xs text-muted-foreground">
              {((data.currentAnalysis.currentPrice - data.currentAnalysis.lowerBand) / 
                (data.currentAnalysis.upperBand - data.currentAnalysis.lowerBand) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="relative h-4 bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 dark:from-green-900 dark:via-yellow-900 dark:to-red-900 rounded-full overflow-hidden border border-border">
            <div 
              className="absolute top-0 h-full w-1 bg-card-foreground shadow-lg"
              style={{
                left: `${Math.min(Math.max(
                  ((data.currentAnalysis.currentPrice - data.currentAnalysis.lowerBand) / 
                   (data.currentAnalysis.upperBand - data.currentAnalysis.lowerBand) * 100), 
                  0), 100)}%`
              }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>Lower Band (Oversold)</span>
            <span>Upper Band (Overbought)</span>
          </div>
        </div>

        {/* Technical Details - Collapsible */}
        <details className="rounded-xl bg-muted/30 border border-border overflow-hidden" open>
          <summary className="cursor-pointer p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-card-foreground inline">
                📊 Model Details & Statistics
              </h4>
              <span className="text-xs text-muted-foreground">Click to expand/collapse</span>
            </div>
          </summary>
          <div className="p-4 pt-0 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground block mb-1">Regression Equation</span>
                <span className="font-mono font-bold text-card-foreground text-sm">
                  {data.regression.equation}
                </span>
              </div>
              
              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground block mb-1">R² (Model Accuracy)</span>
                <span className="font-bold text-card-foreground text-sm">
                  {(data.regression.rSquared * 100).toFixed(2)}%
                </span>
                <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                    style={{ width: `${data.regression.rSquared * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground block mb-1">Channel Width</span>
                <span className="font-bold text-card-foreground text-sm">
                  ${data.channel.channelWidth.toFixed(2)}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground block mb-1">Standard Deviation</span>
                <span className="font-bold text-card-foreground text-sm">
                  ${data.channel.standardDeviation.toFixed(2)}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground block mb-1">Confidence Interval</span>
                <span className="font-bold text-card-foreground text-sm">
                  {data.metadata.confidenceInterval}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground block mb-1">Trend Direction</span>
                <span className={cn(
                  'font-bold text-sm flex items-center gap-1',
                  data.regression.slope > 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                )}>
                  {data.regression.slope > 0 ? '📈 Upward Trend' : '📉 Downward Trend'}
                </span>
              </div>
            </div>
          </div>
        </details>

        {/* Footer Note */}
        <div className="mt-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong>⚠️ Important:</strong> This AI-powered analysis uses a custom Linear Regression model 
            with 2σ standard deviation bands. While statistically sound, past performance does not guarantee 
            future results. Always use this as one of many tools in your research, not as sole investment advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LinearRegressionChannel;

