/**
 * TypeScript types for project analysis functionality.
 *
 * These types match the backend API response structure for the
 * Project Intelligence Agent analysis results.
 */

export interface TechnologyItem {
  /** Technology name (e.g., "React", "Python", "Docker") */
  name: string;
  /** Technology category (e.g., "framework", "language", "tool") */
  category: string;
  /** Confidence score from 0.0 to 1.0 */
  confidence: number;
}

export interface TagItem {
  /** Tag name (e.g., "web-app", "machine-learning", "api") */
  name: string;
  /** Tag category (e.g., "domain", "type", "feature") */
  category: string;
  /** Confidence score from 0.0 to 1.0 (optional - not all agents return this) */
  confidence?: number;
}

export interface AnalysisMetadata {
  /** Unique request identifier for tracking */
  request_id: string;
  /** Name of the agent that performed the analysis */
  agent_name: string;
  /** Processing time in milliseconds */
  processing_time_ms: number;
  /** ISO timestamp when analysis was completed */
  timestamp: string;
}

export interface ProjectAnalysis {
  /** AI-generated project summary (2-3 sentences) */
  summary: string;
  /** Detected technologies with confidence scores */
  technologies: TechnologyItem[];
  /** Categorized tags for discoverability */
  tags: TagItem[];
  /** Key features extracted from repository */
  key_features: string[];
  /** Analysis metadata and processing information */
  metadata: AnalysisMetadata;
}

export interface AnalyzeProjectRequest {
  /** GitHub repository URL to analyze */
  repository_url: string;
}

export interface ErrorDetail {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error context */
  details?: Record<string, unknown>;
  /** ISO timestamp when error occurred */
  timestamp: string;
}

export interface AnalysisResponse {
  /** Whether the analysis was successful */
  success: boolean;
  /** Analysis results (present when success is true) */
  data?: ProjectAnalysis;
  /** Error details (present when success is false) */
  error?: ErrorDetail;
  /** Unique request identifier */
  request_id: string;
}

export interface AnalysisState {
  /** Current analysis data */
  analysis: ProjectAnalysis | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: ErrorDetail | null;
  /** Request ID for tracking */
  requestId: string | null;
}

export interface AnalysisFormData {
  /** GitHub repository URL */
  repositoryUrl: string;
}

export interface AnalysisFormErrors {
  /** Repository URL validation error */
  repositoryUrl?: string;
  /** General form error */
  general?: string;
}

export interface AnalysisFormState {
  /** Form data */
  data: AnalysisFormData;
  /** Form validation errors */
  errors: AnalysisFormErrors;
  /** Form submission state */
  isSubmitting: boolean;
  /** Whether form has been submitted */
  hasSubmitted: boolean;
}

export interface AnalysisPreviewProps {
  /** Analysis results to display */
  analysis: ProjectAnalysis;
  /** Loading state for actions */
  isLoading?: boolean;
  /** Callback when user confirms analysis */
  onConfirm?: (analysis: ProjectAnalysis) => void;
  /** Callback when user wants to edit analysis */
  onEdit?: (analysis: ProjectAnalysis) => void;
  /** Callback when user wants to re-analyze */
  onReAnalyze?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export interface AnalysisFormProps {
  /** Initial repository URL */
  initialUrl?: string;
  /** Callback when analysis is completed (includes analysis data and repository URL) */
  onAnalysisComplete?: (
    analysis: ProjectAnalysis,
    repositoryUrl: string
  ) => void;
  /** Callback when analysis fails */
  onAnalysisError?: (error: ErrorDetail) => void;
  /** Loading state override */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface AnalysisApiClient {
  /** Analyze a GitHub repository */
  analyzeProject(request: AnalyzeProjectRequest): Promise<AnalysisResponse>;
}

export interface AnalysisApiConfig {
  /** Base URL for the analysis API */
  baseUrl: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Number of retry attempts */
  retries: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
}
