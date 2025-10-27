"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    destination: string;
    description?: string;
    start_date: string;
    end_date: string;
  }) => Promise<void>;
}

export const AddTripModal = ({ isOpen, onClose, onSubmit }: AddTripModalProps) => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !url.trim() || !startDate || !endDate) {
      setError("All fields are required");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError("End date must be after start date");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        destination: url.trim(),
        description: description.trim() || undefined,
        start_date: startDate,
        end_date: endDate,
      });
      // Reset form
      setTitle("");
      setUrl("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save trip");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setUrl("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-full sm:max-w-[600px] sm:rounded-lg rounded-none p-0 h-[100vh] sm:h-auto sm:max-h-[90vh] flex flex-col m-0 sm:m-4 sm:translate-x-[-50%] sm:translate-y-[-50%] sm:top-[50%] sm:left-[50%] top-0 left-0 fixed sm:relative">
        {/* Header with close button */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-base-content/10">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-base-content hover:opacity-70 transition-opacity disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-base-content">Add Trip</h1>
          <div className="w-6" />
        </div>

        <form id="add-trip-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="trip-url" className="text-sm font-medium text-base-content/60">
              Trip URL
            </Label>
            <Input
              id="trip-url"
              type="url"
              placeholder="e.g. airbnb.com/rooms/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-base-200 border-none rounded-lg p-4 placeholder:text-base-content/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-title" className="text-sm font-medium text-base-content/60">
              Custom Title
            </Label>
            <Input
              id="custom-title"
              type="text"
              placeholder="Weekend Getaway in the Mountains"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-base-200 border-none rounded-lg p-4 placeholder:text-base-content/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-base-content/60">
              Description (optional)
            </Label>
            <textarea
              id="description"
              placeholder="A cozy cabin for our yearly friends trip."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={4}
              className="w-full bg-base-200 border-none rounded-lg p-4 text-base-content placeholder:text-base-content/40 focus:ring-2 focus:ring-primary resize-none disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-medium text-base-content/60">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-base-200 border-none rounded-lg p-4 disabled:opacity-50"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm font-medium text-base-content/60">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-base-200 border-none rounded-lg p-4 disabled:opacity-50"
                min={startDate || new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
        </form>

        {/* Footer with Save button */}
        <div className="p-4 border-t border-base-content/10">
          <Button
            type="submit"
            form="add-trip-form"
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-content font-bold py-4 px-6 rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-300 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Trip"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
