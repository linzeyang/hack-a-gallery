"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import type { Event } from "@/lib/types/event";

export interface EventCardProps {
  event: Event;
  onClick?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getEventStatus = () => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (now < startDate) {
      return { label: "Upcoming", color: "bg-blue-500" };
    } else if (now >= startDate && now <= endDate) {
      return { label: "Ongoing", color: "bg-green-500" };
    } else {
      return { label: "Past", color: "bg-gray-500" };
    }
  };

  const status = getEventStatus();

  const totalPrizeAmount = event.prizes.reduce((total, prize) => {
    const amount = parseFloat(prize.amount.replace(/[^0-9.-]+/g, ""));
    return total + (isNaN(amount) ? 0 : amount);
  }, 0);

  return (
    <Card
      hover
      className="cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="relative h-40 sm:h-48 w-full bg-linear-to-br from-blue-500 to-purple-600">
        <div className="absolute top-3 right-3">
          <span
            className={`${status.color} text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md`}
          >
            {status.label}
          </span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white p-4">
            <h3 className="text-xl sm:text-2xl font-bold mb-2 line-clamp-2">
              {event.name}
            </h3>
            <p className="text-xs sm:text-sm opacity-90">{event.location}</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <svg
              className="w-4 h-4 mr-1 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="truncate">
              {formatDate(event.startDate)} - {formatDate(event.endDate)}
            </span>
          </div>
        </div>

        <p className="text-sm sm:text-base text-gray-700 mb-4 line-clamp-3">
          {event.description}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-200 gap-2">
          <div className="flex items-center text-xs sm:text-sm">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 mr-1 text-yellow-500 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-semibold text-gray-900">
              {event.prizes.length}{" "}
              {event.prizes.length === 1 ? "Prize" : "Prizes"}
            </span>
            {totalPrizeAmount > 0 && (
              <span className="ml-2 text-gray-600">
                ${totalPrizeAmount.toLocaleString()}
              </span>
            )}
          </div>

          <div className="text-xs sm:text-sm text-gray-500 truncate">
            by {event.organizerName}
          </div>
        </div>
      </div>
    </Card>
  );
};
