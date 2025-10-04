// API client for direct backend communication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3010';

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      image?: string;
    };
    accessToken: string;
    refreshToken: string;
    sessionToken: string;
  };
  error?: string;
}

export const authApi = {
  async login(data: LoginData): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include', // Include cookies
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Login failed',
          error: result.message || 'Login failed'
        };
      }

      return {
        success: result.success || true,
        message: result.message || 'Login successful',
        data: result.data
      };
    } catch (error) {
      console.error('Login API error:', error);
      return {
        success: false,
        message: 'Network error occurred',
        error: 'Network error occurred'
      };
    }
  },

  async logout(): Promise<{ success: boolean }> {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      return { success: true };
    } catch (error) {
      console.error('Logout API error:', error);
      return { success: false };
    }
  },

  async getSession(): Promise<{ user: any | null }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        return { user: null };
      }

      const result = await response.json();
      return { user: result.data?.user || null };
    } catch (error) {
      console.error('Session API error:', error);
      return { user: null };
    }
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Token refresh failed',
          error: result.message || 'Token refresh failed'
        };
      }

      return {
        success: result.success || true,
        message: result.message || 'Token refresh successful',
        data: result.data
      };
    } catch (error) {
      console.error('Token refresh API error:', error);
      return {
        success: false,
        message: 'Network error occurred',
        error: 'Network error occurred'
      };
    }
  }
};