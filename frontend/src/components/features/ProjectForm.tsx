'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Project, TeamMember } from '@/lib/types/project';
import { validateProject } from '@/lib/utils/validation';

export interface ProjectFormProps {
  eventId: string;
  initialData?: Project;
  onSubmit: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  eventId,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    githubUrl: initialData?.githubUrl || '',
    demoUrl: initialData?.demoUrl || '',
    technologies: initialData?.technologies || [],
    teamMembers: initialData?.teamMembers || [{ name: '', role: '', githubUsername: '' }],
    eventId: initialData?.eventId || eventId,
    hackerId: initialData?.hackerId || 'current-user', // TODO: Replace with actual user ID
    isHidden: initialData?.isHidden || false,
  });

  const [techInput, setTechInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddTechnology = () => {
    if (techInput.trim() && !formData.technologies.includes(techInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        technologies: [...prev.technologies, techInput.trim()],
      }));
      setTechInput('');
      // Clear technologies error
      if (errors.technologies) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.technologies;
          return newErrors;
        });
      }
    }
  };

  const handleRemoveTechnology = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((_, i) => i !== index),
    }));
  };

  const handleTechKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTechnology();
    }
  };

  const handleTeamMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    setFormData((prev) => {
      const newTeamMembers = [...prev.teamMembers];
      newTeamMembers[index] = { ...newTeamMembers[index], [field]: value };
      return { ...prev, teamMembers: newTeamMembers };
    });
    // Clear error for this team member field
    const errorKey = `team_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleAddTeamMember = () => {
    setFormData((prev) => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { name: '', role: '', githubUsername: '' }],
    }));
  };

  const handleRemoveTeamMember = (index: number) => {
    if (formData.teamMembers.length > 1) {
      setFormData((prev) => ({
        ...prev,
        teamMembers: prev.teamMembers.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    const validation = validateProject(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Submit form data
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Project Name */}
      <Input
        label="Project Name *"
        inputType="text"
        value={formData.name}
        onChange={(e) => handleInputChange('name', e.target.value)}
        error={errors.name}
        placeholder="Enter your project name"
        disabled={isSubmitting}
      />

      {/* Project Description */}
      <Input
        label="Description *"
        inputType="textarea"
        value={formData.description}
        onChange={(e) => handleInputChange('description', e.target.value)}
        error={errors.description}
        placeholder="Describe your project, what it does, and what problem it solves"
        rows={5}
        disabled={isSubmitting}
      />

      {/* GitHub URL */}
      <Input
        label="GitHub URL *"
        inputType="url"
        value={formData.githubUrl}
        onChange={(e) => handleInputChange('githubUrl', e.target.value)}
        error={errors.githubUrl}
        placeholder="https://github.com/username/repository"
        disabled={isSubmitting}
      />

      {/* Demo URL */}
      <Input
        label="Demo URL (Optional)"
        inputType="url"
        value={formData.demoUrl}
        onChange={(e) => handleInputChange('demoUrl', e.target.value)}
        error={errors.demoUrl}
        placeholder="https://your-demo-site.com"
        disabled={isSubmitting}
      />

      {/* Technologies */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Technologies *
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={handleTechKeyDown}
            placeholder="Add a technology (press Enter)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <Button
            type="button"
            onClick={handleAddTechnology}
            variant="outline"
            disabled={isSubmitting || !techInput.trim()}
          >
            Add
          </Button>
        </div>
        {errors.technologies && (
          <p className="text-sm text-red-600 mb-2">{errors.technologies}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {formData.technologies.map((tech, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
            >
              {tech}
              <button
                type="button"
                onClick={() => handleRemoveTechnology(index)}
                className="ml-1 hover:text-blue-900"
                disabled={isSubmitting}
                aria-label={`Remove ${tech}`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Team Members */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Team Members *
        </label>
        {errors.teamMembers && (
          <p className="text-sm text-red-600 mb-2">{errors.teamMembers}</p>
        )}
        <div className="space-y-4">
          {formData.teamMembers.map((member, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Team Member {index + 1}
                </span>
                {formData.teamMembers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTeamMember(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                    disabled={isSubmitting}
                  >
                    Remove
                  </button>
                )}
              </div>

              <Input
                label="Name *"
                inputType="text"
                value={member.name}
                onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                error={errors[`team_${index}_name`]}
                placeholder="Team member name"
                disabled={isSubmitting}
              />

              <Input
                label="Role *"
                inputType="text"
                value={member.role}
                onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                error={errors[`team_${index}_role`]}
                placeholder="e.g., Full Stack Developer, Designer"
                disabled={isSubmitting}
              />

              <Input
                label="GitHub Username (Optional)"
                inputType="text"
                value={member.githubUsername || ''}
                onChange={(e) => handleTeamMemberChange(index, 'githubUsername', e.target.value)}
                placeholder="github-username"
                disabled={isSubmitting}
              />
            </div>
          ))}
        </div>

        <Button
          type="button"
          onClick={handleAddTeamMember}
          variant="outline"
          className="mt-3"
          disabled={isSubmitting}
        >
          + Add Team Member
        </Button>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
          {initialData ? 'Update Project' : 'Submit Project'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
