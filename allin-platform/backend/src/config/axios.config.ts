import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from '../utils/logger';

/**
 * Axios Configuration with Timeout and Retry Logic
 * PERFORMANCE OPTIMIZATION: Configure timeouts to prevent hanging requests
 * Expected: Faster error detection, prevents resource exhaustion
 */

// Default timeout values (in milliseconds)
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const OAUTH_TIMEOUT = 15000; // 15 seconds for OAuth flows
const UPLOAD_TIMEOUT = 30000; // 30 seconds for file uploads

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Create a configured Axios instance with timeout and retry logic
 */
export function createAxiosInstance(config?: AxiosRequestConfig): AxiosInstance {
  const instance = axios.create({
    timeout: DEFAULT_TIMEOUT,
    ...config,
    headers: {
      'User-Agent': 'AllIN-Platform/1.0',
      ...config?.headers,
    },
  });

  // Request interceptor for logging
  instance.interceptors.request.use(
    (config) => {
      logger.debug('External API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        timeout: config.timeout,
      });
      return config;
    },
    (error) => {
      logger.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for logging and retry logic
  instance.interceptors.response.use(
    (response) => {
      logger.debug('External API Response:', {
        status: response.status,
        url: response.config.url,
      });
      return response;
    },
    async (error) => {
      const config = error.config;

      // Don't retry if we've exceeded max retries
      if (!config || config.__retryCount >= MAX_RETRIES) {
        logger.error('External API Error (max retries exceeded):', {
          url: config?.url,
          error: error.message,
          retries: config?.__retryCount || 0,
        });
        return Promise.reject(error);
      }

      // Initialize retry count
      config.__retryCount = config.__retryCount || 0;

      // Check if error is retryable
      const isRetryableError =
        error.code === 'ECONNABORTED' || // Timeout
        error.code === 'ETIMEDOUT' ||    // Timeout
        error.code === 'ECONNRESET' ||   // Connection reset
        (error.response && error.response.status >= 500); // Server errors

      if (isRetryableError) {
        config.__retryCount += 1;

        // Exponential backoff
        const delay = RETRY_DELAY * Math.pow(2, config.__retryCount - 1);

        logger.warn('Retrying external API request:', {
          url: config.url,
          attempt: config.__retryCount,
          maxRetries: MAX_RETRIES,
          delay,
        });

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));

        // Retry the request
        return instance(config);
      }

      logger.error('External API Error (non-retryable):', {
        url: config?.url,
        error: error.message,
        code: error.code,
        status: error.response?.status,
      });

      return Promise.reject(error);
    }
  );

  return instance;
}

/**
 * Pre-configured Axios instances for different use cases
 */

// Default instance for general API calls
export const apiClient = createAxiosInstance();

// OAuth client with extended timeout for authorization flows
export const oauthClient = createAxiosInstance({
  timeout: OAUTH_TIMEOUT,
});

// Upload client for file uploads
export const uploadClient = createAxiosInstance({
  timeout: UPLOAD_TIMEOUT,
});

/**
 * Helper function to make a request with timeout override
 */
export async function makeRequestWithTimeout<T>(
  url: string,
  options: AxiosRequestConfig = {},
  timeoutMs?: number
): Promise<T> {
  const config: AxiosRequestConfig = {
    ...options,
    timeout: timeoutMs || options.timeout || DEFAULT_TIMEOUT,
  };

  try {
    const response = await apiClient.request<T>({ url, ...config });
    return response.data;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error(`Request timed out after ${config.timeout}ms: ${url}`);
    }
    throw error;
  }
}

/**
 * Helper function for OAuth API calls with proper timeout handling
 */
export async function makeOAuthRequest<T>(
  url: string,
  options: AxiosRequestConfig = {}
): Promise<T> {
  try {
    const response = await oauthClient.request<T>({ url, ...options });
    return response.data;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      logger.error('OAuth request timed out:', {
        url,
        timeout: OAUTH_TIMEOUT,
      });
      throw new Error(`OAuth request timed out after ${OAUTH_TIMEOUT}ms`);
    }

    if (error.response) {
      logger.error('OAuth API error:', {
        url,
        status: error.response.status,
        data: error.response.data,
      });
    }

    throw error;
  }
}

export default {
  apiClient,
  oauthClient,
  uploadClient,
  makeRequestWithTimeout,
  makeOAuthRequest,
};
