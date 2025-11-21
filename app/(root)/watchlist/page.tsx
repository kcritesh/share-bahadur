import { getWatchlistWithData } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import Link from "next/link";
import { Star } from "lucide-react";
import WatchlistManager from "@/components/WatchlistManager";
import SearchCommand from "@/components/SearchCommand";
import { searchStocks } from "@/lib/actions/finnhub.actions";

export default async function WatchlistPage() {
  const watchlistItems = await getWatchlistWithData();
  const initialStocks = await searchStocks();

  if (watchlistItems.length === 0) {
    return (
      <div className="watchlist-empty-container">
        <div className="watchlist-empty">
          <Star className="watchlist-star" />
          <h2 className="empty-title">Your Watchlist is Empty</h2>
          <p className="empty-description">
            Start adding stocks to your watchlist to track their performance and get personalized insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/" 
              className="bg-[#0B3D66] hover:bg-[#0B3D66]/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Browse Stocks
            </Link>
            <SearchCommand 
              renderAs="button" 
              label="Add Stocks" 
              initialStocks={initialStocks}
            />
          </div>
        </div>
      </div>
    );
  }

  // Fetch news for watchlist stocks
  const symbols = watchlistItems.map(item => item.symbol);
  const news = await getNews(symbols).catch(() => []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#212529] mb-2">My Watchlist</h1>
          <p className="text-[#6C757D]">
            Track your favorite stocks and monitor their performance in real-time
          </p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/" 
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-[#212529] px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Browse Stocks
          </Link>
          <SearchCommand 
            renderAs="button" 
            label="Add Stocks" 
            initialStocks={initialStocks}
          />
        </div>
      </div>

      {/* Watchlist Manager */}
      <WatchlistManager initialItems={watchlistItems} news={news} />
    </div>
  );
}

