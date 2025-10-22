import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PrizeCard } from "./PrizeCard";
import type { PrizeAward } from "@/lib/types/prize";
import type { Event, Prize } from "@/lib/types/event";

interface PrizeSectionProps {
  prizeAwards: PrizeAward[];
  event: Event | null;
}

/**
 * PrizeSection Component
 *
 * Displays the "Awards & Recognition" section on project detail pages.
 * Shows all prizes won by the project with full details and event context.
 * Includes an empty state when no prizes have been won.
 */
export function PrizeSection({ prizeAwards, event }: PrizeSectionProps) {
  // If no prizes, show empty state
  if (prizeAwards.length === 0) {
    return (
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Awards & Recognition
          </h2>
        </CardHeader>
        <CardBody className="p-4 sm:p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
            </div>
            <p className="text-sm sm:text-base text-gray-500">No awards yet</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              This project hasn&apos;t won any prizes
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Map prize awards to prizes with event context
  const prizesWithContext: Array<{
    prize: Prize;
    awardedAt: string;
    eventName?: string;
  }> = [];

  for (const award of prizeAwards) {
    const prize = event?.prizes.find((p) => p.id === award.prizeId);
    if (prize) {
      prizesWithContext.push({
        prize,
        awardedAt: award.awardedAt,
        eventName: event?.name,
      });
    }
  }

  return (
    <Card className="mb-4 sm:mb-6">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Awards & Recognition
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {prizeAwards.length} {prizeAwards.length === 1 ? "Prize" : "Prizes"}
          </span>
        </div>
      </CardHeader>
      <CardBody className="p-4 sm:p-6">
        <div className="space-y-4">
          {prizesWithContext.map((item, index) => (
            <PrizeCard
              key={index}
              prize={item.prize}
              awardedAt={item.awardedAt}
              eventName={item.eventName}
            />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
