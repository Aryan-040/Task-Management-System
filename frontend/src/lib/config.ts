/**
 * Configuration for the frontend application.
 * This file exports the API URL based on the environment.
 */

/**
 * Returns the base URL for the backend API.
 * Priority:
 * 1. NEXT_PUBLIC_API_URL environment variable (if set)
 * 2. Production URL (when deployed)
 * 3. Local development URL (default)
 */
export function getApiUrl(): string {
  // First, try to get from environment variable (works locally)
  if (typeof window !== 'undefined' && (window as any).__ENV__?.API_URL) {
    return (window as any).__ENV__.API_URL;
  }

  // Check if we have the public env var
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Production detection: check if we're on Vercel production
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If deployed on Vercel (not localhost)
    if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
      // Return your production Render backend URL
      return 'https://task-management-system-snkn.onrender.com';
    }
  }

  // Default to local development
  return 'http://localhost:3001';
}

export const API_URL = getApiUrl();
