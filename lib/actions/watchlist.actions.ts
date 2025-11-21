'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';

// Helper function to fetch historical price from Yahoo Finance
async function getHistoricalPrice(symbol: string, date: Date): Promise<number | null> {
  try {
    // Yahoo Finance requires timestamps in seconds
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // Get a range: target date and 7 days before (to handle weekends/holidays)
    const endDate = new Date(targetDate);
    endDate.setDate(endDate.getDate() + 1); // Add 1 day to include target date
    const startDate = new Date(targetDate);
    startDate.setDate(startDate.getDate() - 7);
    
    const period1 = Math.floor(startDate.getTime() / 1000);
    const period2 = Math.floor(endDate.getTime() / 1000);
    
    // Yahoo Finance API endpoint
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    
    if (!response.ok) {
      console.warn(`Yahoo Finance API error for ${symbol}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Check if we have valid data
    if (!data?.chart?.result?.[0]?.timestamp || !data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close) {
      console.warn(`No historical data available for ${symbol}`);
      return null;
    }
    
    const timestamps = data.chart.result[0].timestamp;
    const closes = data.chart.result[0].indicators.quote[0].close;
    
    // Find the closest date to our target (prefer the exact date or the closest previous trading day)
    let closestPrice: number | null = null;
    let closestTimeDiff = Infinity;
    
    for (let i = 0; i < timestamps.length; i++) {
      const historicalDate = new Date(timestamps[i] * 1000);
      const timeDiff = Math.abs(targetDate.getTime() - historicalDate.getTime());
      
      // Only consider dates on or before the target date
      if (historicalDate <= targetDate && timeDiff < closestTimeDiff && closes[i] !== null) {
        closestPrice = closes[i];
        closestTimeDiff = timeDiff;
      }
    }
    
    return closestPrice;
  } catch (error) {
    console.error(`Error fetching historical price for ${symbol}:`, error);
    return null;
  }
}

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    // Better Auth stores users in the "user" collection
    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByEmail error:', err);
    return [];
  }
}

export async function addToWatchlist(symbol: string, company: string): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return { success: false, message: 'User not authenticated' };
    }

    await connectToDatabase();
    
    const existingItem = await Watchlist.findOne({ 
      userId: session.user.id, 
      symbol: symbol.toUpperCase() 
    });

    if (existingItem) {
      return { success: false, message: 'Stock already in watchlist' };
    }

    // Fetch current price from Finnhub
    let addedAtPrice: number | undefined;
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    
    if (FINNHUB_API_KEY) {
      try {
        const quoteRes = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${FINNHUB_API_KEY}`,
          { cache: 'no-store' }
        );
        const quote = await quoteRes.json();
        addedAtPrice = quote.c || undefined;
      } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error);
      }
    }

    await Watchlist.create({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
      company: company,
      addedAt: new Date(),
      addedAtPrice,
    });

    return { success: true, message: 'Added to watchlist' };
  } catch (err) {
    console.error('addToWatchlist error:', err);
    return { success: false, message: 'Failed to add to watchlist' };
  }
}

export async function removeFromWatchlist(symbol: string): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return { success: false, message: 'User not authenticated' };
    }

    await connectToDatabase();
    
    const result = await Watchlist.deleteOne({ 
      userId: session.user.id, 
      symbol: symbol.toUpperCase() 
    });

    if (result.deletedCount === 0) {
      return { success: false, message: 'Stock not in watchlist' };
    }

    return { success: true, message: 'Removed from watchlist' };
  } catch (err) {
    console.error('removeFromWatchlist error:', err);
    return { success: false, message: 'Failed to remove from watchlist' };
  }
}

export async function getWatchlistItems() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return [];
    }

    await connectToDatabase();
    
    const items = await Watchlist.find({ userId: session.user.id })
      .sort({ addedAt: -1 })
      .lean();

    return items.map((item) => ({
      symbol: String(item.symbol),
      company: String(item.company),
      addedAt: item.addedAt.toISOString(),
    }));
  } catch (err) {
    console.error('getWatchlistItems error:', err);
    return [];
  }
}

export async function isInWatchlist(symbol: string): Promise<boolean> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return false;
    }

    await connectToDatabase();
    
    const item = await Watchlist.findOne({ 
      userId: session.user.id, 
      symbol: symbol.toUpperCase() 
    });

    return !!item;
  } catch (err) {
    console.error('isInWatchlist error:', err);
    return false;
  }
}

export async function getWatchlistWithData() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return [];
    }

    await connectToDatabase();
    
    const items = await Watchlist.find({ userId: session.user.id })
      .sort({ addedAt: -1 })
      .lean();

    // Fetch live data from Finnhub for each stock
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    
    if (!FINNHUB_API_KEY) {
      console.warn('Finnhub API key not configured');
      return items.map((item) => ({
        userId: String(item.userId),
        symbol: String(item.symbol),
        company: String(item.company),
        addedAt: item.addedAt,
      }));
    }

    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        try {
          // Fetch quote data
          const quoteRes = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${item.symbol}&token=${FINNHUB_API_KEY}`,
            { cache: 'no-store' }
          );
          const quote = await quoteRes.json();

          // Fetch profile data
          const profileRes = await fetch(
            `https://finnhub.io/api/v1/stock/profile2?symbol=${item.symbol}&token=${FINNHUB_API_KEY}`,
            { cache: 'no-store' }
          );
          const profile = await profileRes.json();

          const currentPrice = quote.c || 0;
          const changePercent = quote.dp || 0;

          // Calculate change since added
          let changeSinceAdded: number | undefined;
          let changeSinceAddedFormatted = 'N/A';
          let addedAtPrice = (item as any).addedAtPrice;
          
          // If addedAtPrice is not stored, try to fetch historical price from Alpha Vantage
          if (!addedAtPrice && currentPrice > 0) {
            addedAtPrice = await getHistoricalPrice(item.symbol, item.addedAt);
            
            // Update the database with the fetched historical price
            if (addedAtPrice) {
              await Watchlist.updateOne(
                { userId: item.userId, symbol: item.symbol },
                { $set: { addedAtPrice } }
              ).catch(err => console.error('Error updating addedAtPrice:', err));
            }
          }
          
          if (addedAtPrice && currentPrice > 0) {
            changeSinceAdded = ((currentPrice - addedAtPrice) / addedAtPrice) * 100;
            changeSinceAddedFormatted = changeSinceAdded !== 0 
              ? `${changeSinceAdded > 0 ? '+' : ''}${changeSinceAdded.toFixed(2)}%` 
              : '0.00%';
          }

          return {
            userId: String(item.userId),
            symbol: String(item.symbol),
            company: profile.name || String(item.company),
            addedAt: item.addedAt,
            addedAtPrice,
            currentPrice,
            changePercent,
            changeSinceAdded,
            priceFormatted: currentPrice > 0 ? `$${currentPrice.toFixed(2)}` : 'N/A',
            changeFormatted: changePercent !== 0 ? `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%` : 'N/A',
            changeSinceAddedFormatted,
            marketCap: profile.marketCapitalization 
              ? `$${(profile.marketCapitalization / 1000).toFixed(2)}B` 
              : 'N/A',
            peRatio: 'N/A', // Can be added if needed
          };
        } catch (error) {
          console.error(`Error fetching data for ${item.symbol}:`, error);
          return {
            userId: String(item.userId),
            symbol: String(item.symbol),
            company: String(item.company),
            addedAt: item.addedAt,
            addedAtPrice: (item as any).addedAtPrice,
            currentPrice: 0,
            changePercent: 0,
            changeSinceAdded: undefined,
            priceFormatted: 'N/A',
            changeFormatted: 'N/A',
            changeSinceAddedFormatted: 'N/A',
            marketCap: 'N/A',
            peRatio: 'N/A',
          };
        }
      })
    );

    return enrichedItems;
  } catch (err) {
    console.error('getWatchlistWithData error:', err);
    return [];
  }
}
