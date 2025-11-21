"use client";
import React, { useMemo, useState, useTransition } from "react";
import { addToWatchlist, removeFromWatchlist } from "@/lib/actions/watchlist.actions";
import { toast } from "sonner";
import { Star, Trash2, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);
  const [isPending, startTransition] = useTransition();

  const label = useMemo(() => {
    if (type === "icon") return added ? "" : "";
    return added ? "Remove from Watchlist" : "Add to Watchlist";
  }, [added, type]);

  const handleClick = async () => {
    startTransition(async () => {
      try {
        if (added) {
          const result = await removeFromWatchlist(symbol);
          if (result.success) {
            setAdded(false);
            toast.success(`${symbol} removed from watchlist`);
            onWatchlistChange?.(symbol, false);
          } else {
            toast.error(result.message);
          }
        } else {
          const result = await addToWatchlist(symbol, company);
          if (result.success) {
            setAdded(true);
            toast.success(`${symbol} added to watchlist`);
            onWatchlistChange?.(symbol, true);
          } else {
            toast.error(result.message);
          }
        }
      } catch (error) {
        toast.error("Something went wrong. Please try again.");
        console.error("WatchlistButton error:", error);
      }
    });
  };

  if (type === "icon") {
    return (
      <button
        title={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        aria-label={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        className={cn(
          "p-2 rounded-lg transition-all duration-200 hover:scale-110",
          "focus:outline-none focus:ring-2 focus:ring-yellow-500/50",
          added 
            ? "text-yellow-500 hover:text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20" 
            : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950/20",
          isPending && "opacity-50 cursor-not-allowed"
        )}
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <Star 
            className={cn("h-6 w-6 transition-all", added && "fill-yellow-500")} 
          />
        )}
      </button>
    );
  }

  return (
    <button 
      className={cn(
        "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold",
        "transition-all duration-200 hover:scale-105 active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        added 
          ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white focus:ring-red-500"
          : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white focus:ring-blue-500"
      )}
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {showTrashIcon && added ? (
            <Trash2 className="w-5 h-5" />
          ) : added ? (
            <Star className="w-5 h-5 fill-white" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          <span>{label}</span>
        </>
      )}
    </button>
  );
};

export default WatchlistButton;
