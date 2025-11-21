import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import TechnicalIndicators from "@/components/TechnicalIndicators";
import LinearRegressionChannel from "@/components/LinearRegressionChannel";
import {
  SYMBOL_INFO_WIDGET_CONFIG,
  BASELINE_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";
import { isInWatchlist } from "@/lib/actions/watchlist.actions";
import { Sparkles, TrendingUp } from "lucide-react";

export default async function StockDetails({ params }: StockDetailsPageProps) {
  const { symbol } = await params;
  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;
  
  // Check if stock is in watchlist
  const inWatchlist = await isInWatchlist(symbol);

  return (
    <div className="flex min-h-screen p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-[1800px] mx-auto space-y-8">
        {/* Hero Section - Stock Info & Watchlist */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 rounded-xl bg-card shadow-lg border border-border/50">
          <div className="flex-1 w-full lg:w-auto">
            <TradingViewWidget
              scriptUrl={`${scriptUrl}symbol-info.js`}
              config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
              height={170}
            />
          </div>
          <div className="flex items-center gap-3">
            <WatchlistButton 
              symbol={symbol.toUpperCase()} 
              company={symbol.toUpperCase()} 
              isInWatchlist={inWatchlist} 
            />
          </div>
        </div>

        {/* Priority: ML-Powered Linear Regression Analysis */}
        <div className="relative">
          {/* ML Badge */}
          <div className="absolute -top-3 left-6 z-10 flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-semibold">AI-Powered Analysis</span>
          </div>
          <LinearRegressionChannel symbol={symbol} />
        </div>

        {/* Interactive Chart with Technical Indicators */}
        <div className="rounded-xl bg-card shadow-lg border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-card-foreground">
                Technical Analysis & Indicators
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Customize your chart with professional trading indicators
            </p>
          </div>
          <div className="p-4">
            <TechnicalIndicators symbol={symbol} />
          </div>
        </div>

        {/* Comprehensive Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Baseline Chart */}
          <div className="rounded-xl bg-card shadow-lg border border-border/50 overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="text-base font-semibold text-card-foreground">
                Price Chart
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Historical price movements and trends
              </p>
            </div>
            <div className="p-2">
              <TradingViewWidget
                scriptUrl={`${scriptUrl}advanced-chart.js`}
                config={BASELINE_WIDGET_CONFIG(symbol)}
                className="custom-chart"
                height={500}
              />
            </div>
          </div>

          {/* Technical Analysis Summary */}
          <div className="rounded-xl bg-card shadow-lg border border-border/50 overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="text-base font-semibold text-card-foreground">
                Technical Analysis Summary
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aggregate signals from multiple indicators
              </p>
            </div>
            <div className="p-2">
              <TradingViewWidget
                scriptUrl={`${scriptUrl}technical-analysis.js`}
                config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
                height={500}
              />
            </div>
          </div>
        </div>

        {/* Company Fundamentals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Profile */}
          <div className="rounded-xl bg-card shadow-lg border border-border/50 overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="text-base font-semibold text-card-foreground">
                Company Profile
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Business overview and key metrics
              </p>
            </div>
            <div className="p-2">
              <TradingViewWidget
                scriptUrl={`${scriptUrl}company-profile.js`}
                config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
                height={440}
              />
            </div>
          </div>

          {/* Financial Statements */}
          <div className="rounded-xl bg-card shadow-lg border border-border/50 overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="text-base font-semibold text-card-foreground">
                Financial Statements
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Revenue, earnings, and balance sheet data
              </p>
            </div>
            <div className="p-2">
              <TradingViewWidget
                scriptUrl={`${scriptUrl}financials.js`}
                config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
                height={440}
              />
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border">
          <p className="text-xs text-muted-foreground text-center">
            <strong>Investment Disclaimer:</strong> The information provided on this page, including AI-powered analysis and technical indicators, 
            is for informational purposes only and should not be considered as financial advice. Always conduct your own research and consult 
            with a qualified financial advisor before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
