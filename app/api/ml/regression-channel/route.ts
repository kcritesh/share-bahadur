import { NextRequest, NextResponse } from 'next/server';
import { calculateRegressionChannel, formatRegressionEquation } from '@/lib/ml/linear-regression';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

/**
 * Fetch historical candle data from Alpha Vantage API
 * @param symbol - Stock symbol (e.g., "AAPL")
 * @param days - Number of days to fetch (default 90)
 */
async function fetchHistoricalData(symbol: string, days: number = 90) {
  const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
  
  if (!apiKey) {
    throw new Error('Alpha Vantage API key not configured');
  }

  // Determine output size based on days requested
  // Alpha Vantage: compact = last 100 data points, full = 20+ years
  const outputsize = days > 100 ? 'full' : 'compact';

  const url = `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}&outputsize=${outputsize}`;

  const response = await fetch(url, { 
    cache: 'no-store',
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch historical data: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Check for API errors
  if (data['Error Message']) {
    throw new Error(`Alpha Vantage API Error: ${data['Error Message']}`);
  }

  if (data['Note']) {
    throw new Error('API rate limit reached. Please try again later.');
  }

  const timeSeries = data['Time Series (Daily)'];
  
  if (!timeSeries || Object.keys(timeSeries).length === 0) {
    throw new Error('No historical data available for this symbol');
  }

  // Parse and sort data by date (most recent first)
  const dates = Object.keys(timeSeries).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Limit to requested number of days
  const limitedDates = dates.slice(0, days);

  // Extract data arrays (reverse to get chronological order - oldest to newest)
  const timestamps: number[] = [];
  const closePrices: number[] = [];
  const highPrices: number[] = [];
  const lowPrices: number[] = [];
  const openPrices: number[] = [];
  const volumes: number[] = [];

  // Reverse to get chronological order (oldest to newest)
  for (let i = limitedDates.length - 1; i >= 0; i--) {
    const date = limitedDates[i];
    const dayData = timeSeries[date];
    
    timestamps.push(new Date(date).getTime() / 1000); // Convert to Unix timestamp
    openPrices.push(parseFloat(dayData['1. open']));
    highPrices.push(parseFloat(dayData['2. high']));
    lowPrices.push(parseFloat(dayData['3. low']));
    closePrices.push(parseFloat(dayData['4. close']));
    volumes.push(parseInt(dayData['5. volume']));
  }

  return {
    timestamps,
    closePrices,
    highPrices,
    lowPrices,
    openPrices,
    volumes,
  };
}

/**
 * GET endpoint for Linear Regression Channel analysis
 * Query params: symbol (required), days (optional, default 90)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
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
    const historicalData = await fetchHistoricalData(symbol.toUpperCase(), days);

    // Validate we have enough data
    if (historicalData.closePrices.length < 10) {
      return NextResponse.json(
        { error: 'Insufficient historical data for analysis (minimum 10 days required)' },
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
    
    return NextResponse.json(
      { 
        error: 'Failed to calculate regression channel',
        details: errorMessage,
      },
      { status: 500 }
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

