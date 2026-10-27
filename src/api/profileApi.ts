import { RadixExportProfile } from '../types/profile';

export interface StoredProfile {
  id: string;
  profile: RadixExportProfile;
  created_at: string;
  updated_at: string;
}

export interface DeletedProfile {
  message: string;
  id: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new Error('Could not reach the profile API. Check that the backend is running.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    if (response.ok) {
      throw new Error('The profile API returned an invalid response.');
    }
  }

  if (!response.ok) {
    const detail = typeof body === 'object' && body !== null && 'detail' in body
      ? body.detail
      : undefined;
    const message = Array.isArray(detail)
      ? detail.map((issue) => {
          if (typeof issue !== 'object' || issue === null) return String(issue);
          const item = issue as { loc?: unknown[]; msg?: unknown };
          const field = Array.isArray(item.loc)
            ? item.loc.filter((part) => part !== 'body').join('.')
            : '';
          return `${field ? `${field}: ` : ''}${String(item.msg ?? 'Invalid value')}`;
        }).join(' ')
      : typeof detail === 'string'
        ? detail
        : response.status >= 500
          ? `The profile API is unavailable (HTTP ${response.status}). Check that the backend is running.`
          : `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return body as T;
}

function requireStoredProfile(record: StoredProfile): StoredProfile {
  if (
    !record ||
    typeof record.id !== 'string' ||
    !record.id.trim() ||
    typeof record.profile !== 'object' ||
    record.profile === null
  ) {
    throw new Error('The backend response did not include a confirmed profile record.');
  }
  return record;
}

export function saveProfile(profile: RadixExportProfile, profileId: string | null) {
  const path = profileId ? `/${encodeURIComponent(profileId)}` : '';
  return request<StoredProfile>(`/profiles${path}`, {
    method: profileId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  }).then(requireStoredProfile);
}

export function loadProfile(profileId: string) {
  return request<StoredProfile>(`/profiles/${encodeURIComponent(profileId)}`).then(requireStoredProfile);
}

export async function deleteProfile(profileId: string): Promise<DeletedProfile> {
  const result = await request<DeletedProfile>(`/profiles/${encodeURIComponent(profileId)}`, {
    method: 'DELETE',
  });
  if (!result || result.id !== profileId || typeof result.message !== 'string') {
    throw new Error('The backend did not confirm deletion of this profile.');
  }
  return result;
}
