export type UserRole = 'STUDIO_OWNER' | 'STUDIO_MEMBER' | 'ADMIN';

export type EventStatus = 
  | 'DRAFT' 
  | 'ACTIVE' 
  | 'SELECTION_SUBMITTED' 
  | 'ARCHIVED' 
  | 'EXPIRED' 
  | 'PURGED';

export type MediaStatus = 
  | 'PENDING_UPLOAD' 
  | 'UPLOADED' 
  | 'PROCESSING' 
  | 'READY' 
  | 'FAILED';

export type RoundStatus = 
  | 'OPEN' 
  | 'SUBMITTED' 
  | 'APPROVED' 
  | 'LOCKED';

export interface MediaItemDTO {
  id: string;
  eventId: string;
  originalFilename: string;
  originalKey: string;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  mimeType: string;
  fileSizeBytes: number;
  width: number | null;
  height: number | null;
  status: MediaStatus;
  sortOrder: number;
  createdAt: string;
}

export interface StudioBrandingDTO {
  studioName: string;
  studioLogoUrl?: string | null;
  brandColor?: string | null;
  instagramHandle?: string | null;
  websiteUrl?: string | null;
}

export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  studioName: string;
  phone?: string | null;
  role: UserRole;
  studioLogoUrl?: string | null;
  brandColor?: string | null;
  instagramHandle?: string | null;
  websiteUrl?: string | null;
  defaultWatermark?: boolean;
  isDemo?: boolean;
  expiresAt?: string | null;
}

export interface EventDTO {
  id: string;
  title: string;
  slug: string;
  eventType: string;
  eventDate: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  pin: string; // Only shown upon creation or in agency dashboard
  coverUrl?: string | null;
  status: EventStatus;
  photoCount: number;
  totalBytes: number;
  maxSelections?: number | null;
  enableWatermark?: boolean;
  expiresAt: string;
  gracePeriodEndsAt: string;
}

export interface ClientGalleryDTO {
  id: string;
  title: string;
  slug: string;
  eventType: string;
  eventDate: string;
  clientName: string;
  status: EventStatus;
  photoCount: number;
  maxSelections?: number | null;
  enableWatermark?: boolean;
  requiresPin: boolean;
  isUnlocked: boolean;
  roundStatus: RoundStatus;
  studio?: StudioBrandingDTO;
  media: MediaItemDTO[];
  selectedMediaIds: string[];
}

export interface InitiateUploadRequest {
  eventId: string;
  filename: string;
  fileSizeBytes: number;
  mimeType: string;
}

export interface InitiateUploadResponse {
  mediaId: string;
  key: string;
  uploadUrl: string;
  headers?: Record<string, string>;
  isDirectS3: boolean;
}

export interface CompleteUploadRequest {
  mediaId: string;
  key: string;
  eventId: string;
}

export interface ProcessImageJobPayload {
  mediaId: string;
  eventId: string;
  key: string;
  originalFilename: string;
}

export interface VerifyPinRequest {
  slug: string;
  pin: string;
}

export interface SubmitSelectionRequest {
  slug: string;
  selectedMediaIds: string[];
  clientNotes?: string;
}
