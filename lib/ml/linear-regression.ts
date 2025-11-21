/**
 * Linear Regression Channel Implementation
 * Pure TypeScript implementation without external ML libraries
 * For educational/college project purposes
 */

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  predictions: number[];
}

export interface RegressionChannelResult {
  regression: RegressionResult;
  upperBand: number[];
  lowerBand: number[];
  middleLine: number[];
  standardDeviation: number;
  currentPrice: number;
  predictedPrice: number;
  signal: 'BUY' | 'SELL' | 'HOLD';
  signalStrength: number;
  distanceFromUpper: number;
  distanceFromLower: number;
  channelWidth: number;
}

/**
 * Calculate linear regression using least squares method
 * Formula: y = mx + b
 * Where: m = slope, b = intercept
 * 
 * slope (m) = (n*Σxy - Σx*Σy) / (n*Σx² - (Σx)²)
 * intercept (b) = (Σy - m*Σx) / n
 */
export function calculateLinearRegression(
  xValues: number[],
  yValues: number[]
): RegressionResult {
  const n = xValues.length;
  
  if (n === 0 || n !== yValues.length) {
    throw new Error('Invalid input: arrays must have same non-zero length');
  }

  // Calculate sums
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += xValues[i];
    sumY += yValues[i];
    sumXY += xValues[i] * yValues[i];
    sumX2 += xValues[i] * xValues[i];
    sumY2 += yValues[i] * yValues[i];
  }

  // Calculate slope (m)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  // Calculate intercept (b)
  const intercept = (sumY - slope * sumX) / n;

  // Calculate predictions
  const predictions = xValues.map(x => slope * x + intercept);

  // Calculate R-squared (coefficient of determination)
  const meanY = sumY / n;
  let ssTotal = 0; // Total sum of squares
  let ssResidual = 0; // Residual sum of squares

  for (let i = 0; i < n; i++) {
    ssTotal += Math.pow(yValues[i] - meanY, 2);
    ssResidual += Math.pow(yValues[i] - predictions[i], 2);
  }

  const rSquared = ssTotal === 0 ? 0 : 1 - (ssResidual / ssTotal);

  return {
    slope,
    intercept,
    rSquared,
    predictions,
  };
}

/**
 * Calculate standard deviation of residuals
 * std_dev = sqrt(Σ(actual - predicted)² / n)
 */
export function calculateStandardDeviation(
  actualValues: number[],
  predictedValues: number[]
): number {
  const n = actualValues.length;
  
  if (n === 0 || n !== predictedValues.length) {
    throw new Error('Invalid input: arrays must have same non-zero length');
  }

  let sumSquaredDifferences = 0;

  for (let i = 0; i < n; i++) {
    const difference = actualValues[i] - predictedValues[i];
    sumSquaredDifferences += difference * difference;
  }

  const variance = sumSquaredDifferences / n;
  const standardDeviation = Math.sqrt(variance);

  return standardDeviation;
}

/**
 * Calculate upper and lower channel bands
 * Upper Band = Predicted Value + (multiplier * std_dev)
 * Lower Band = Predicted Value - (multiplier * std_dev)
 * 
 * @param multiplier - Standard deviation multiplier (default 2 for ~95% confidence)
 */
export function calculateChannelBands(
  predictions: number[],
  standardDeviation: number,
  multiplier: number = 2
): { upperBand: number[]; lowerBand: number[] } {
  const upperBand = predictions.map(pred => pred + multiplier * standardDeviation);
  const lowerBand = predictions.map(pred => pred - multiplier * standardDeviation);

  return { upperBand, lowerBand };
}

/**
 * Generate trading signal based on current price position within channel
 * 
 * BUY: Price near or below lower band (oversold)
 * SELL: Price near or above upper band (overbought)
 * HOLD: Price within middle range
 */
export function generateSignal(
  currentPrice: number,
  predictedPrice: number,
  upperBandValue: number,
  lowerBandValue: number
): { signal: 'BUY' | 'SELL' | 'HOLD'; strength: number } {
  const channelWidth = upperBandValue - lowerBandValue;
  const distanceFromMiddle = currentPrice - predictedPrice;
  const normalizedPosition = distanceFromMiddle / (channelWidth / 2);

  // Calculate signal strength (0-100)
  const strength = Math.min(100, Math.abs(normalizedPosition) * 100);

  // Determine signal
  // BUY if below -0.7 (near lower band)
  // SELL if above 0.7 (near upper band)
  // HOLD otherwise
  if (normalizedPosition <= -0.7) {
    return { signal: 'BUY', strength: Math.min(100, strength) };
  } else if (normalizedPosition >= 0.7) {
    return { signal: 'SELL', strength: Math.min(100, strength) };
  } else {
    return { signal: 'HOLD', strength: 100 - strength };
  }
}

/**
 * Main function to calculate complete regression channel analysis
 * 
 * @param prices - Array of historical price data (closing prices)
 * @param stdDevMultiplier - Multiplier for standard deviation bands (default 2)
 * @returns Complete regression channel analysis
 */
export function calculateRegressionChannel(
  prices: number[],
  stdDevMultiplier: number = 2
): RegressionChannelResult {
  if (prices.length < 2) {
    throw new Error('Need at least 2 price points for regression analysis');
  }

  // Create x-axis values (0, 1, 2, ..., n-1)
  const xValues = Array.from({ length: prices.length }, (_, i) => i);
  
  // Calculate linear regression
  const regression = calculateLinearRegression(xValues, prices);
  
  // Calculate standard deviation of residuals
  const standardDeviation = calculateStandardDeviation(prices, regression.predictions);
  
  // Calculate channel bands
  const { upperBand, lowerBand } = calculateChannelBands(
    regression.predictions,
    standardDeviation,
    stdDevMultiplier
  );

  // Get current (most recent) values
  const lastIndex = prices.length - 1;
  const currentPrice = prices[lastIndex];
  const predictedPrice = regression.predictions[lastIndex];
  const currentUpperBand = upperBand[lastIndex];
  const currentLowerBand = lowerBand[lastIndex];

  // Generate trading signal
  const { signal, strength } = generateSignal(
    currentPrice,
    predictedPrice,
    currentUpperBand,
    currentLowerBand
  );

  // Calculate distances from bands (as percentage)
  const channelWidth = currentUpperBand - currentLowerBand;
  const distanceFromUpper = ((currentUpperBand - currentPrice) / channelWidth) * 100;
  const distanceFromLower = ((currentPrice - currentLowerBand) / channelWidth) * 100;

  return {
    regression,
    upperBand,
    lowerBand,
    middleLine: regression.predictions,
    standardDeviation,
    currentPrice,
    predictedPrice,
    signal,
    signalStrength: strength,
    distanceFromUpper,
    distanceFromLower,
    channelWidth,
  };
}

/**
 * Helper function to format regression equation as string
 * y = mx + b
 */
export function formatRegressionEquation(slope: number, intercept: number): string {
  const slopeSign = slope >= 0 ? '+' : '';
  const interceptSign = intercept >= 0 ? '+' : '';
  return `y = ${slopeSign}${slope.toFixed(4)}x ${interceptSign} ${intercept.toFixed(2)}`;
}

