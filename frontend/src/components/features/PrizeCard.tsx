import type { Prize } from "@/lib/types/event";

interface PrizeCardProps {
  prize: Prize;
  awardedAt: string;
  eventName?: string;
}

/**
 * PrizeCard Component
 *
 * Displays individual prize information for a project's awards section.
 * Shows prize icon/badge, title, amount, description, and award date.
 */
export function PrizeCard({ prize, awardedAt, eventName }: PrizeCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Prize Icon/Badge */}
        <div className="shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-linear-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Prize Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2 mb-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 wrap-break-word">
              {prize.title}
            </h3>
            <span className="text-base sm:text-lg font-bold text-yellow-600 whitespace-nowrap">
              {prize.amount}
            </span>
          </div>

          {prize.description && (
            <p className="text-sm sm:text-base text-gray-600 mb-3 leading-relaxed">
              {prize.description}
            </p>
          )}

          <div className="flex flex-col gap-1 text-xs sm:text-sm text-gray-500">
            <p>Awarded on {formatDate(awardedAt)}</p>
            {eventName && <p className="text-gray-400">From {eventName}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
