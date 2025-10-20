'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Event, Prize } from '@/lib/types/event';
import { validateEvent } from '@/lib/utils/validation';

export interface EventFormProps {
  initialData?: Event;
  onSubmit: (data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EventForm: React.FC<EventFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    location: initialData?.location || '',
    requirements: initialData?.requirements || '',
    organizerId: initialData?.organizerId || 'org_default',
    organizerName: initialData?.organizerName || '',
    isHidden: initialData?.isHidden || false,
  });

  const [prizes, setPrizes] = useState<Prize[]>(
    initialData?.prizes || [{ title: '', amount: '', description: '' }]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePrizeChange = (
    index: number,
    field: keyof Prize,
    value: string
  ) => {
    const newPrizes = [...prizes];
    newPrizes[index] = { ...newPrizes[index], [field]: value };
    setPrizes(newPrizes);
    
    // Clear error for this prize field
    const errorKey = `prize_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const addPrize = () => {
    setPrizes([...prizes, { title: '', amount: '', description: '' }]);
  };

  const removePrize = (index: number) => {
    if (prizes.length > 1) {
      setPrizes(prizes.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const eventData = {
      ...formData,
      prizes: prizes.filter((p) => p.title.trim() || p.amount.trim()),
    };

    const validation = validateEvent(eventData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSubmit(eventData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <Input
          label="Event Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          error={errors.name}
          placeholder="AWS AI Agent Global Hackathon 2025"
          required
        />

        <Input
          label="Description"
          name="description"
          inputType="textarea"
          value={formData.description}
          onChange={handleInputChange}
          error={errors.description}
          placeholder="Describe your hackathon event..."
          rows={4}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            name="startDate"
            inputType="date"
            value={formData.startDate}
            onChange={handleInputChange}
            error={errors.startDate}
            required
          />

          <Input
            label="End Date"
            name="endDate"
            inputType="date"
            value={formData.endDate}
            onChange={handleInputChange}
            error={errors.endDate}
            required
          />
        </div>

        <Input
          label="Location"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          error={errors.location}
          placeholder="Virtual, San Francisco, CA, etc."
          required
        />

        <Input
          label="Organizer Name"
          name="organizerName"
          value={formData.organizerName}
          onChange={handleInputChange}
          error={errors.organizerName}
          placeholder="Your organization name"
          required
        />

        <Input
          label="Requirements"
          name="requirements"
          inputType="textarea"
          value={formData.requirements}
          onChange={handleInputChange}
          error={errors.requirements}
          placeholder="Participation requirements, eligibility criteria, etc."
          rows={3}
        />

        {/* Prizes Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Prizes
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPrize}
            >
              + Add Prize
            </Button>
          </div>

          {prizes.map((prize, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Prize {index + 1}
                </span>
                {prizes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePrize(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <Input
                label="Prize Title"
                value={prize.title}
                onChange={(e) =>
                  handlePrizeChange(index, 'title', e.target.value)
                }
                error={errors[`prize_${index}_title`]}
                placeholder="Grand Prize, Best Design, etc."
              />

              <Input
                label="Prize Amount"
                value={prize.amount}
                onChange={(e) =>
                  handlePrizeChange(index, 'amount', e.target.value)
                }
                error={errors[`prize_${index}_amount`]}
                placeholder="$10,000"
              />

              <Input
                label="Prize Description"
                inputType="textarea"
                value={prize.description}
                onChange={(e) =>
                  handlePrizeChange(index, 'description', e.target.value)
                }
                placeholder="Description of the prize..."
                rows={2}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={isLoading}>
          {initialData ? 'Update Event' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
};
