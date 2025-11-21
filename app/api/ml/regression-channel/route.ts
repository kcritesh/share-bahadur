import { NextRequest, NextResponse } from 'next/server';
import { calculateRegressionChannel, formatRegressionEquation } from '@/lib/ml/linear-regression';
import YahooFinanceImport from 'yahoo-finance2';

// Initialize Yahoo Finance v3 API
const yahooFinance = new YahooFinanceImport({ 
  suppressNotices: ['ripHistorical'] // Suppress deprecation warnings
});

/**
 * Fetch historical candle data from Yahoo Finance API
 * @param symbol - Stock symbol (e.g., "AAPL")
 * @param days - Number of days to fetch (default 90)
 */
async function fetchHistoricalData(symbol: string, days: number = 90) {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days - 5); // Add buffer days to ensure we get enough data

    // Fetch historical data from Yahoo Finance using chart API (historical is deprecated)
    const queryOptions = {
      period1: startDate,
      period2: endDate,
      interval: '1d' as const,
    };

    // Note: Using historical() which internally maps to chart() in v3
    const result: any = await yahooFinance.historical(symbol, queryOptions);

    if (!result || result.length === 0) {
      throw new Error('No historical data available for this symbol');
    }

    // Sort by date (oldest to newest) - Yahoo Finance returns in chronological order
    result.sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

    // Limit to exactly requested number of days (take the most recent ones)
    const limitedResult = result.slice(-days);

    // Extract data arrays in chronological order (oldest to newest)
    const timestamps: number[] = [];
    const closePrices: number[] = [];
    const highPrices: number[] = [];
    const lowPrices: number[] = [];
    const openPrices: number[] = [];
    const volumes: number[] = [];

    for (const dayData of limitedResult) {
      // Validate that we have all required data
      if (
        dayData.close === null || 
        dayData.close === undefined ||
        dayData.high === null || 
        dayData.high === undefined ||
        dayData.low === null || 
        dayData.low === undefined ||
        dayData.open === null ||
        dayData.open === undefined
      ) {
        console.warn('Skipping incomplete data point:', dayData.date);
        continue; // Skip incomplete data points
      }

      timestamps.push(dayData.date.getTime() / 1000); // Convert to Unix timestamp
      openPrices.push(dayData.open);
      highPrices.push(dayData.high);
      lowPrices.push(dayData.low);
      closePrices.push(dayData.close);
      volumes.push(dayData.volume || 0);
    }

    // Validate we collected enough valid data
    if (closePrices.length === 0) {
      throw new Error(`No valid price data found for ${symbol}. The symbol may be delisted or have incomplete data.`);
    }

    console.log(`Processed ${closePrices.length} valid data points for ${symbol}`);

    return {
      timestamps,
      closePrices,
      highPrices,
      lowPrices,
      openPrices,
      volumes,
    };
  } catch (error) {
    console.error(`Yahoo Finance fetch error for ${symbol}:`, error);
    
    if (error instanceof Error) {
      // Handle Yahoo Finance specific errors
      if (error.message.includes('No data found') || 
          error.message.includes('Quote not found') ||
          error.message.includes('Invalid cookie')) {
        throw new Error(`Invalid stock symbol: ${symbol}. Please verify the ticker symbol is correct.`);
      }
      if (error.message.includes('Not Found') || error.message.includes('404')) {
        throw new Error(`Stock symbol not found: ${symbol}. The symbol may be delisted or incorrect.`);
      }
      if (error.message.includes('Too Many Requests') || error.message.includes('429')) {
        throw new Error('Yahoo Finance rate limit reached. Please try again in a few moments.');
      }
      // Re-throw with more context
      throw new Error(`Failed to fetch data for ${symbol}: ${error.message}`);
    }
    throw new Error(`Failed to fetch historical data from Yahoo Finance for ${symbol}`);
  }
}

/**
 * GET endpoint for Linear Regression Channel analysis
 * Query params: symbol (required), days (optional, default 90)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  
  try {
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 90;

    // Validate input
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    if (days < 10 || days > 365) {
      return NextResponse.json(
        { error: 'Days parameter must be between 10 and 365' },
        { status: 400 }
      );
    }

    // Fetch historical data
    console.log(`Fetching ${days} days of data for ${symbol.toUpperCase()}...`);
    const historicalData = await fetchHistoricalData(symbol.toUpperCase(), days);
    console.log(`Received ${historicalData.closePrices.length} data points`);

    // Validate we have enough data
    if (historicalData.closePrices.length < 10) {
      return NextResponse.json(
        { 
          error: 'Insufficient historical data for analysis',
          details: `Only ${historicalData.closePrices.length} days of data available. Minimum 10 days required.`,
          symbol: symbol.toUpperCase()
        },
        { status: 400 }
      );
    }

    // Calculate regression channel
    const channelResult = calculateRegressionChannel(historicalData.closePrices, 2);

    // Prepare response
    const response = {
      symbol: symbol.toUpperCase(),
      dataPoints: historicalData.closePrices.length,
      daysAnalyzed: days,
      regression: {
        equation: formatRegressionEquation(
          channelResult.regression.slope,
          channelResult.regression.intercept
        ),
        slope: channelResult.regression.slope,
        intercept: channelResult.regression.intercept,
        rSquared: channelResult.regression.rSquared,
      },
      currentAnalysis: {
        currentPrice: channelResult.currentPrice,
        predictedPrice: channelResult.predictedPrice,
        upperBand: channelResult.upperBand[channelResult.upperBand.length - 1],
        lowerBand: channelResult.lowerBand[channelResult.lowerBand.length - 1],
        middleLine: channelResult.predictedPrice,
      },
      channel: {
        standardDeviation: channelResult.standardDeviation,
        channelWidth: channelResult.channelWidth,
        distanceFromUpper: channelResult.distanceFromUpper,
        distanceFromLower: channelResult.distanceFromLower,
      },
      signal: {
        action: channelResult.signal,
        strength: channelResult.signalStrength,
        explanation: getSignalExplanation(
          channelResult.signal,
          channelResult.currentPrice,
          channelResult.predictedPrice,
          channelResult.upperBand[channelResult.upperBand.length - 1],
          channelResult.lowerBand[channelResult.lowerBand.length - 1]
        ),
      },
      metadata: {
        calculatedAt: new Date().toISOString(),
        modelType: 'Linear Regression Channel',
        confidenceInterval: '95%',
      },
    };

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });

  } catch (error) {
    console.error('Error in regression channel API:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Determine appropriate status code
    const isClientError = errorMessage.includes('Invalid stock symbol') || 
                         errorMessage.includes('not found') ||
                         errorMessage.includes('No historical data');
    
    return NextResponse.json(
      { 
        error: 'Failed to calculate regression channel',
        details: errorMessage,
        symbol: searchParams.get('symbol')?.toUpperCase(),
      },
      { status: isClientError ? 404 : 500 }
    );
  }
}

/**
 * Generate human-readable explanation for trading signal
 */
function getSignalExplanation(
  signal: 'BUY' | 'SELL' | 'HOLD',
  currentPrice: number,
  predictedPrice: number,
  upperBand: number,
  lowerBand: number
): string {
  const priceDiff = currentPrice - predictedPrice;
  const priceDiffPercent = ((priceDiff / predictedPrice) * 100).toFixed(2);

  switch (signal) {
    case 'BUY':
      return `Price ($${currentPrice.toFixed(2)}) is near the lower band ($${lowerBand.toFixed(2)}), suggesting the stock may be oversold. This could be a buying opportunity as prices tend to revert to the mean.`;
    
    case 'SELL':
      return `Price ($${currentPrice.toFixed(2)}) is near the upper band ($${upperBand.toFixed(2)}), suggesting the stock may be overbought. Consider taking profits as prices tend to revert to the mean.`;
    
    case 'HOLD':
      return `Price ($${currentPrice.toFixed(2)}) is near the regression line ($${predictedPrice.toFixed(2)}), ${priceDiff > 0 ? `${priceDiffPercent}% above` : `${Math.abs(parseFloat(priceDiffPercent))}% below`} predicted value. The stock is trading within normal range. Wait for a clearer signal.`;
    
    default:
      return 'Signal analysis unavailable';
  }
}

