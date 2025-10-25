"use client";

import React, { useState } from "react";
import type { Prize } from "@/lib/types/event";
import { useTranslations } from "next-intl";

export interface PrizeTooltipProps {
  prizes: Prize[];
  children: React.ReactNode;
}

/**
 * PrizeTooltip Component
 *
 * Displays prize details in a tooltip on hover.
 * Shows prize titles and amounts with smooth fade-in/out transitions.
 * Implements accessible tooltip patterns with proper ARIA attributes.
 */
export const PrizeTooltip: React.FC<PrizeTooltipProps> = ({
  prizes,
  children,
}) => {
  const t = useTranslations("events");
  const [isVisible, setIsVisible] = useState(false);

  if (prizes.length === 0) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {/* Trigger Element */}
      <div
        role="button"
        tabIndex={0}
        aria-label={t("showPrizeDetails")}
        aria-describedby="prize-tooltip"
      >
        {children}
      </div>

      {/* Tooltip */}
      {isVisible && (
        <div
          id="prize-tooltip"
          role="tooltip"
          className="absolute z-50 top-full right-0 mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl animate-fade-in"
          style={{
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          {/* Tooltip Arrow */}
          <div
            className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45"
            aria-hidden="true"
          />

          {/* Tooltip Content */}
          <div className="relative">
            <p className="font-semibold mb-2 text-yellow-400">
              {prizes.length === 1 ? t("prizeWon") : t("prizesWon")}
            </p>
            <ul className="space-y-2">
              {prizes.map((prize, index) => (
                <li
                  key={prize.id || index}
                  className="border-t border-gray-700 pt-2 first:border-t-0 first:pt-0"
                >
                  <div className="font-medium text-white">{prize.title}</div>
                  <div className="text-yellow-300 text-xs mt-0.5">
                    {prize.amount}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
