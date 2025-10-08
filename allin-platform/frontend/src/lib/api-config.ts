/**
 * API Configuration
 *
 * This file centralizes all API URL configuration to prevent hardcoded URLs
 * and ensure proper connectivity in both Docker and local development.
 */

/**
 * Get the backend API URL based on the environment
 *
 * - In Docker containers (server-side): Use Docker service name
 * - In browser (client-side): Use localhost or public URL
 */
export function getBackendUrl(): string {
  // Check if we're running server-side (in Docker container)
  const isServer = typeof window === 'undefined';

  if (isServer) {
    // Server-side (inside Docker): Use Docker service name
    return process.env.API_BASE_URL ||
           process.env.NEXT_PUBLIC_API_URL ||
           'http://backend-dev:7000';
  } else {
    // Client-side (browser): Use localhost or public URL
    return process.env.NEXT_PUBLIC_API_URL ||
           process.env.NEXT_PUBLIC_API_BASE_URL ||
           'http://localhost:7000';
  }
}

/**
 * Backend API URL for server-side requests (API routes)
 */
export const API_URL = getBackendUrl();

/**
 * Backend API URL for client-side requests (browser)
 */
export const CLIENT_API_URL = process.env.NEXT_PUBLIC_API_URL ||
                               process.env.NEXT_PUBLIC_API_BASE_URL ||
                               'http://localhost:7000';
