"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { EventForm } from "@/components/features/EventForm";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import type { Event } from "@/lib/types/event";

interface EventCreateClientProps {
  initialEvent?: Event;
  eventId?: string;
}

export function EventCreateClient({ initialEvent, eventId }: EventCreateClientProps) {
  const router = useRouter();
  const isEditMode = !!eventId;

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (
    formData: Omit<Event, "id" | "createdAt" | "updatedAt">
  ) => {
    setIsLoading(true);
    setFeedback(null);

    try {
      const url = isEditMode && eventId ? `/api/events/${eventId}` : '/api/events';
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback({
          type: "success",
          message: isEditMode
            ? "Event updated successfully!"
            : "Event created successfully!",
        });

        // Navigate to event detail page after a short delay
        setTimeout(() => {
          router.push(`/events/${data.id}`);
        }, 1000);
      } else {
        const error = await response.json();
        setFeedback({
          type: "error",
          message: error.error || "Failed to save event",
        });
        setIsLoading(false);
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode && eventId) {
      router.push(`/events/${eventId}`);
    } else {
      router.push("/events");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {isEditMode ? "Edit Event" : "Create New Event"}
        </h1>
        <p className="text-gray-600">
          {isEditMode
            ? "Update your hackathon event details"
            : "Set up a new hackathon event and start accepting project submissions"}
        </p>
      </div>

      {feedback && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            feedback.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
          role="alert"
        >
          <div className="flex items-center">
            {feedback.type === "success" ? (
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Event Information</h2>
        </CardHeader>
        <CardBody>
          <EventForm
            initialData={initialEvent}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </CardBody>
      </Card>
    </div>
  );
}
