import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import AccountsPage from '../../../allin-platform/frontend/app/dashboard/accounts/page';
import { mockTikTokResponses } from '../../test-data/fixtures/social-accounts';

// Mock fetch for API calls
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock window.location for OAuth redirects
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3001',
  },
  writable: true,
});

// Mock React hooks
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
}));

describe('AccountsPage - TikTok Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('TikTok Account Display', () => {
    it('should display TikTok platform in the accounts list', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      } as Response);

      // Act
      render(<AccountsPage />);

      // Assert
      expect(screen.getByText('TikTok')).toBeInTheDocument();
      expect(screen.getByTestId('tiktok-platform-card')).toBeInTheDocument();
    });

    it('should show correct TikTok branding and colors', async () => {
      // Act
      render(<AccountsPage />);

      // Assert
      const tiktokCard = screen.getByTestId('tiktok-platform-card');
      const tiktokIcon = within(tiktokCard).getByRole('img', { name: /tiktok/i });
      
      expect(tiktokIcon).toHaveClass('text-gray-900'); // TikTok brand color
      expect(tiktokCard).toContainElement(tiktokIcon);
    });

    it('should display TikTok as not connected by default', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      } as Response);

      // Act
      render(<AccountsPage />);

      // Assert
      const tiktokCard = screen.getByTestId('tiktok-platform-card');
      expect(within(tiktokCard).getByText('Not Connected')).toBeInTheDocument();
      expect(within(tiktokCard).getByText('Connect TikTok')).toBeInTheDocument();
    });

    it('should display connected TikTok account information', async () => {
      // Arrange
      const connectedTikTokAccount = {
        id: 'tiktok_account_123',
        platform: 'TIKTOK',
        username: 'testcreator',
        displayName: 'Test Creator',
        followersCount: 50000,
        status: 'ACTIVE',
        lastSync: '2024-01-15T10:30:00Z',
        platformData: {
          videoCount: 125,
          likesCount: 500000,
          isVerified: true
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: [connectedTikTokAccount] 
        }),
      } as Response);

      // Act
      render(<AccountsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      // Assert
      const tiktokCard = screen.getByTestId('tiktok-platform-card');
      expect(within(tiktokCard).getByText('Connected')).toBeInTheDocument();
      expect(within(tiktokCard).getByText('@testcreator')).toBeInTheDocument();
      expect(within(tiktokCard).getByText('50000')).toBeInTheDocument(); // Followers
      expect(within(tiktokCard).getByText('125')).toBeInTheDocument(); // Videos
    });

    it('should show TikTok verification badge for verified accounts', async () => {
      // Arrange
      const verifiedTikTokAccount = {
        id: 'verified_tiktok_123',
        platform: 'TIKTOK',
        username: 'verifiedcreator',
        displayName: 'Verified Creator',
        status: 'ACTIVE',
        platformData: {
          isVerified: true,
          videoCount: 200,
          followerCount: 1000000
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: [verifiedTikTokAccount] 
        }),
      } as Response);

      // Act
      render(<AccountsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      // Assert
      const tiktokCard = screen.getByTestId('tiktok-platform-card');
      expect(within(tiktokCard).getByTestId('verification-badge')).toBeInTheDocument();
    });
  });

  describe('TikTok Connection Flow', () => {
    it('should initiate TikTok OAuth flow when connect button is clicked', async () => {
      // Arrange
      const mockAuthUrl = 'https://www.tiktok.com/v2/auth/authorize/?client_key=test&state=abc123';
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            authUrl: mockAuthUrl 
          }),
        } as Response);

      // Act
      render(<AccountsPage />);
      
      const connectButton = await screen.findByText('Connect TikTok');
      await user.click(connectButton);

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/social/connect/TIKTOK', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      });

      expect(window.location.href).toBe(mockAuthUrl);
    });

    it('should show loading state during TikTok connection', async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
        .mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

      // Act
      render(<AccountsPage />);
      
      const connectButton = await screen.findByText('Connect TikTok');
      await user.click(connectButton);

      // Assert
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle TikTok connection errors gracefully', async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ 
            success: false, 
            error: 'TikTok API temporarily unavailable' 
          }),
        } as Response);

      // Act
      render(<AccountsPage />);
      
      const connectButton = await screen.findByText('Connect TikTok');
      await user.click(connectButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Failed to connect to TikTok/)).toBeInTheDocument();
      });
    });

    it('should prevent multiple concurrent TikTok connection attempts', async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
        .mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

      // Act
      render(<AccountsPage />);
      
      const connectButton = await screen.findByText('Connect TikTok');
      
      // Click multiple times rapidly
      await user.click(connectButton);
      await user.click(connectButton);
      await user.click(connectButton);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2); // Once for initial load, once for connect
    });

    it('should handle successful TikTok connection callback', async () => {
      // Arrange
      const searchParams = new URLSearchParams('?success=connected&platform=TIKTOK');
      
      jest.mocked(require('next/navigation').useSearchParams).mockReturnValue(searchParams);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      } as Response);

      // Act
      render(<AccountsPage />);

      // Assert
      expect(screen.getByText(/Successfully connected to TikTok/)).toBeInTheDocument();
      expect(screen.getByTestId('success-alert')).toBeInTheDocument();
    });

    it('should handle TikTok connection callback errors', async () => {
      // Arrange
      const searchParams = new URLSearchParams('?error=access_denied');
      
      jest.mocked(require('next/navigation').useSearchParams).mockReturnValue(searchParams);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      } as Response);

      // Act
      render(<AccountsPage />);

      // Assert
      expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
      expect(screen.getByTestId('error-alert')).toBeInTheDocument();
    });
  });

  describe('TikTok Account Management', () => {
    it('should allow disconnecting TikTok account', async () => {
      // Arrange
      const connectedTikTokAccount = {
        id: 'tiktok_account_123',
        platform: 'TIKTOK',
        username: 'testcreator',
        status: 'ACTIVE',
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            data: [connectedTikTokAccount] 
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            message: 'Successfully disconnected from TikTok' 
          }),
        } as Response);

      // Act
      render(<AccountsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      const disconnectButton = screen.getByTestId('disconnect-tiktok-button');
      await user.click(disconnectButton);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`/api/social/disconnect/${connectedTikTokAccount.id}`, {
        method: 'DELETE',
      });

      await waitFor(() => {
        expect(screen.getByText(/Successfully disconnected from TikTok/)).toBeInTheDocument();
      });
    });

    it('should refresh TikTok account tokens', async () => {
      // Arrange
      const connectedTikTokAccount = {
        id: 'tiktok_account_123',
        platform: 'TIKTOK',
        username: 'testcreator',
        status: 'ACTIVE',
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            data: [connectedTikTokAccount] 
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            message: 'Tokens refreshed successfully' 
          }),
        } as Response);

      // Act
      render(<AccountsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      const refreshButton = screen.getByTestId('refresh-tiktok-button');
      await user.click(refreshButton);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`/api/social/refresh/${connectedTikTokAccount.id}`, {
        method: 'POST',
      });
    });

    it('should handle TikTok account refresh errors', async () => {
      // Arrange
      const connectedTikTokAccount = {
        id: 'tiktok_account_123',
        platform: 'TIKTOK',
        username: 'testcreator',
        status: 'ACTIVE',
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            data: [connectedTikTokAccount] 
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ 
            success: false, 
            error: 'Token refresh failed' 
          }),
        } as Response);

      // Act
      render(<AccountsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      const refreshButton = screen.getByTestId('refresh-tiktok-button');
      await user.click(refreshButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Failed to refresh/)).toBeInTheDocument();
      });
    });
  });

  describe('TikTok Analytics Display', () => {
    it('should display TikTok-specific metrics', async () => {
      // Arrange
      const tiktokAccountWithMetrics = {
        id: 'tiktok_account_123',
        platform: 'TIKTOK',
        username: 'viralcreator',
        displayName: 'Viral Creator',
        followersCount: 250000,
        status: 'ACTIVE',
        platformData: {
          videoCount: 89,
          likesCount: 2500000,
          averageViews: 50000,
          engagementRate: 8.5,
          topPerformingVideo: {
            id: 'viral_video_123',
            title: 'Amazing Dance',
            viewCount: 1000000,
            likeCount: 85000
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: [tiktokAccountWithMetrics] 
        }),
      } as Response);

      // Act
      render(<AccountsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      // Assert
      const tiktokCard = screen.getByTestId('tiktok-platform-card');
      expect(within(tiktokCard).getByText('250000')).toBeInTheDocument(); // Followers
      expect(within(tiktokCard).getByText('89')).toBeInTheDocument(); // Videos
      expect(within(tiktokCard).getByText('2.5M')).toBeInTheDocument(); // Total likes (formatted)
      expect(within(tiktokCard).getByText('8.5%')).toBeInTheDocument(); // Engagement rate
    });

    it('should show TikTok video performance metrics', async () => {
      // Arrange
      const tiktokAccountWithVideos = {
        id: 'tiktok_account_123',
        platform: 'TIKTOK',
        username: 'contentcreator',
        status: 'ACTIVE',
        platformData: {
          recentVideos: [
            {
              id: 'video_1',
              title: 'Dance Tutorial',
              viewCount: 150000,
              likeCount: 12000,
              commentCount: 850,
              shareCount: 400
            },
            {
              id: 'video_2',
              title: 'Cooking Hack',
              viewCount: 89000,
              likeCount: 7200,
              commentCount: 320,
              shareCount: 180
            }
          ]
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: [tiktokAccountWithVideos] 
        }),
      } as Response);

      // Act
      render(<AccountsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      // Open analytics modal or section
      const viewAnalyticsButton = screen.getByTestId('view-tiktok-analytics');
      await user.click(viewAnalyticsButton);

      // Assert
      expect(screen.getByText('Dance Tutorial')).toBeInTheDocument();
      expect(screen.getByText('150K views')).toBeInTheDocument();
      expect(screen.getByText('12K likes')).toBeInTheDocument();
    });

    it('should format TikTok numbers correctly', async () => {
      // Arrange
      const tiktokAccountWithLargeNumbers = {
        id: 'tiktok_mega_account',
        platform: 'TIKTOK',
        username: 'megacreator',
        followersCount: 5200000, // 5.2M
        status: 'ACTIVE',
        platformData: {
          videoCount: 1250,
          likesCount: 125000000, // 125M
          totalViews: 1500000000 // 1.5B
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: [tiktokAccountWithLargeNumbers] 
        }),
      } as Response);

      // Act
      render(<AccountsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      // Assert
      const tiktokCard = screen.getByTestId('tiktok-platform-card');
      expect(within(tiktokCard).getByText('5.2M')).toBeInTheDocument(); // Followers
      expect(within(tiktokCard).getByText('125M')).toBeInTheDocument(); // Total likes
      expect(within(tiktokCard).getByText('1.5B')).toBeInTheDocument(); // Total views
    });
  });

  describe('TikTok Error Handling', () => {
    it('should handle TikTok API rate limiting gracefully', async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({ 
            success: false, 
            error: 'Rate limit exceeded' 
          }),
        } as Response);

      // Act
      render(<AccountsPage />);
      
      const connectButton = await screen.findByText('Connect TikTok');
      await user.click(connectButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Rate limit exceeded/)).toBeInTheDocument();
        expect(screen.getByText(/Please try again later/)).toBeInTheDocument();
      });
    });

    it('should show appropriate error for TikTok account suspension', async () => {
      // Arrange
      const suspendedTikTokAccount = {
        id: 'suspended_account',
        platform: 'TIKTOK',
        username: 'suspendeduser',
        status: 'SUSPENDED',
        error: 'Account temporarily suspended'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: [suspendedTikTokAccount] 
        }),
      } as Response);

      // Act
      render(<AccountsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Suspended')).toBeInTheDocument();
      });

      // Assert
      const tiktokCard = screen.getByTestId('tiktok-platform-card');
      expect(within(tiktokCard).getByText('Account temporarily suspended')).toBeInTheDocument();
      expect(within(tiktokCard).getByTestId('warning-icon')).toBeInTheDocument();
    });

    it('should handle network errors during TikTok operations', async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<AccountsPage />);
      
      const connectButton = await screen.findByText('Connect TikTok');
      await user.click(connectButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
        expect(screen.getByText(/Check your connection/)).toBeInTheDocument();
      });
    });
  });

  describe('TikTok Accessibility', () => {
    it('should have proper ARIA labels for TikTok elements', async () => {
      // Act
      render(<AccountsPage />);

      // Assert
      const tiktokCard = screen.getByTestId('tiktok-platform-card');
      expect(tiktokCard).toHaveAttribute('aria-label', expect.stringContaining('TikTok'));
      
      const connectButton = screen.getByLabelText(/Connect TikTok account/);
      expect(connectButton).toBeInTheDocument();
    });

    it('should support keyboard navigation for TikTok actions', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      } as Response);

      // Act
      render(<AccountsPage />);
      
      const connectButton = await screen.findByText('Connect TikTok');
      connectButton.focus();
      
      // Simulate Enter key press
      fireEvent.keyDown(connectButton, { key: 'Enter', code: 'Enter' });

      // Assert
      expect(connectButton).toHaveFocus();
    });

    it('should provide screen reader announcements for TikTok status changes', async () => {
      // Arrange
      const connectedTikTokAccount = {
        id: 'tiktok_account_123',
        platform: 'TIKTOK',
        username: 'testcreator',
        status: 'ACTIVE',
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            data: [connectedTikTokAccount] 
          }),
        } as Response);

      // Act
      render(<AccountsPage />);
      
      // Simulate successful connection
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      // Assert
      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent(/TikTok account connected successfully/);
    });
  });

  describe('TikTok Performance', () => {
    it('should load TikTok account data efficiently', async () => {
      // Arrange
      const startTime = performance.now();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: Array(10).fill(0).map((_, i) => ({
            id: `tiktok_${i}`,
            platform: 'TIKTOK',
            username: `creator_${i}`,
            status: 'ACTIVE'
          }))
        }),
      } as Response);

      // Act
      render(<AccountsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      // Assert
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should load within 2 seconds
    });

    it('should debounce TikTok refresh requests', async () => {
      // Arrange
      const connectedTikTokAccount = {
        id: 'tiktok_account_123',
        platform: 'TIKTOK',
        username: 'testcreator',
        status: 'ACTIVE',
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            data: [connectedTikTokAccount] 
          }),
        } as Response)
        .mockResolvedValue({
          ok: true,
          json: async () => ({ 
            success: true, 
            message: 'Refreshed' 
          }),
        } as Response);

      // Act
      render(<AccountsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      const refreshButton = screen.getByTestId('refresh-tiktok-button');
      
      // Click rapidly multiple times
      await user.click(refreshButton);
      await user.click(refreshButton);
      await user.click(refreshButton);

      // Assert
      // Should only make one refresh request despite multiple clicks
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2); // Initial load + one refresh
      });
    });
  });
});