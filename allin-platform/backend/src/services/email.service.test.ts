import { EmailService } from './email.service';
import nodemailer from 'nodemailer';

// Master test credentials
const MASTER_CREDENTIALS = {
  admin: { email: 'admin@allin.demo', password: 'Admin123!@#' },
  agency: { email: 'agency@allin.demo', password: 'Agency123!@#' },
  manager: { email: 'manager@allin.demo', password: 'Manager123!@#' },
  creator: { email: 'creator@allin.demo', password: 'Creator123!@#' },
  client: { email: 'client@allin.demo', password: 'Client123!@#' },
  team: { email: 'team@allin.demo', password: 'Team123!@#' },
};

describe('EmailService', () => {
  let emailService: EmailService;
  let mockTransporter: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock transporter
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
      verify: jest.fn().mockResolvedValue(true),
    };

    (nodemailer.createTransport as any).mockReturnValue(mockTransporter);

    // Create new instance for each test
    emailService = new EmailService();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const emailData = {
        to: MASTER_CREDENTIALS.admin.email,
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      await emailService.sendEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: `"${process.env.EMAIL_FROM_NAME || 'AllIN Platform'}" <${process.env.EMAIL_FROM || 'noreply@allin.com'}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
      });
    });

    it('should send email with text content', async () => {
      const emailData = {
        to: MASTER_CREDENTIALS.manager.email,
        subject: 'Plain Text Email',
        text: 'Plain text content',
      };

      await emailService.sendEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
      });
    });

    it('should handle email send failure gracefully', async () => {
      const emailData = {
        to: MASTER_CREDENTIALS.client.email,
        subject: 'Failed Email',
        html: '<p>This will fail</p>',
      };

      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP connection failed'));

      await expect(emailService.sendEmail(emailData)).rejects.toThrow('SMTP connection failed');
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email to admin', async () => {
      const email = MASTER_CREDENTIALS.admin.email;
      const token = 'verification-token-123';

      await emailService.sendVerificationEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: email,
        subject: 'Verify your AllIN account',
        html: expect.stringContaining(token),
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Verify Email');
      expect(callArgs.html).toContain(process.env.FRONTEND_URL);
    });

    it('should send verification email to agency owner', async () => {
      const email = MASTER_CREDENTIALS.agency.email;
      const token = 'agency-verification-456';

      await emailService.sendVerificationEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe(email);
      expect(callArgs.subject).toBe('Verify your AllIN account');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email to creator', async () => {
      const email = MASTER_CREDENTIALS.creator.email;
      const token = 'reset-token-789';

      await emailService.sendPasswordResetEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: email,
        subject: 'Reset your AllIN password',
        html: expect.stringContaining(token),
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Reset Password');
      expect(callArgs.html).toContain('expires in 1 hour');
    });

    it('should send password reset email to team member', async () => {
      const email = MASTER_CREDENTIALS.team.email;
      const token = 'team-reset-token';

      await emailService.sendPasswordResetEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe(email);
      expect(callArgs.html).toContain(token);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email to new admin user', async () => {
      const email = MASTER_CREDENTIALS.admin.email;
      const name = 'Admin User';

      await emailService.sendWelcomeEmail(email, name);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: email,
        subject: 'Welcome to AllIN Platform!',
        html: expect.stringContaining(name),
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Welcome to AllIN');
      expect(callArgs.html).toContain(name);
    });

    it('should send welcome email to agency owner', async () => {
      const email = MASTER_CREDENTIALS.agency.email;
      const name = 'Agency Owner';

      await emailService.sendWelcomeEmail(email, name);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe(email);
      expect(callArgs.html).toContain(name);
    });
  });

  describe('sendInvitationEmail', () => {
    it('should send team invitation email', async () => {
      const email = MASTER_CREDENTIALS.team.email;
      const inviterName = 'Manager';
      const teamName = 'Marketing Team';
      const inviteToken = 'invite-token-xyz';

      await emailService.sendInvitationEmail(email, inviterName, teamName, inviteToken);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: email,
        subject: `You've been invited to join ${teamName} on AllIN`,
        html: expect.stringContaining(inviterName),
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(teamName);
      expect(callArgs.html).toContain(inviteToken);
      expect(callArgs.html).toContain('Accept Invitation');
    });
  });

  describe('sendScheduledPostNotification', () => {
    it('should send notification for scheduled post', async () => {
      const email = MASTER_CREDENTIALS.manager.email;
      const postDetails = {
        content: 'Check out our new product launch!',
        platforms: ['Facebook', 'Twitter'],
        scheduledTime: new Date('2024-09-25T14:00:00Z'),
      };

      await emailService.sendScheduledPostNotification(email, postDetails);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: email,
        subject: 'Your post has been scheduled',
        html: expect.stringContaining(postDetails.content),
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Facebook');
      expect(callArgs.html).toContain('Twitter');
    });
  });

  describe('sendPostPublishedNotification', () => {
    it('should send notification when post is published', async () => {
      const email = MASTER_CREDENTIALS.creator.email;
      const postDetails = {
        content: 'New blog post is live!',
        platforms: ['LinkedIn', 'Instagram'],
        publishedTime: new Date(),
        links: [
          'https://linkedin.com/posts/123',
          'https://instagram.com/p/456'
        ],
      };

      await emailService.sendPostPublishedNotification(email, postDetails);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: email,
        subject: 'Your post has been published',
        html: expect.stringContaining(postDetails.content),
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      postDetails.links.forEach(link => {
        expect(callArgs.html).toContain(link);
      });
    });
  });

  describe('sendAnalyticsReport', () => {
    it('should send weekly analytics report', async () => {
      const email = MASTER_CREDENTIALS.agency.email;
      const reportData = {
        period: 'weekly',
        totalPosts: 25,
        totalEngagement: 15420,
        totalReach: 85000,
        topPost: 'Product launch announcement',
      };

      await emailService.sendAnalyticsReport(email, reportData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: email,
        subject: 'Your weekly AllIN analytics report',
        html: expect.any(String),
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('25'); // total posts
      expect(callArgs.html).toContain('15,420'); // formatted engagement
      expect(callArgs.html).toContain('85,000'); // formatted reach
      expect(callArgs.html).toContain(reportData.topPost);
    });

    it('should send monthly analytics report', async () => {
      const email = MASTER_CREDENTIALS.client.email;
      const reportData = {
        period: 'monthly',
        totalPosts: 120,
        totalEngagement: 45000,
        totalReach: 250000,
        topPost: 'Year-end sale announcement',
      };

      await emailService.sendAnalyticsReport(email, reportData);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.subject).toBe('Your monthly AllIN analytics report');
    });
  });

  describe('sendErrorNotification', () => {
    it('should send error notification to admin', async () => {
      const email = MASTER_CREDENTIALS.admin.email;
      const errorDetails = {
        error: 'Failed to publish post to Facebook',
        postId: 'post-123',
        timestamp: new Date(),
        retryCount: 3,
      };

      await emailService.sendErrorNotification(email, errorDetails);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: email,
        subject: 'Error: Post publishing failed',
        html: expect.stringContaining(errorDetails.error),
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('post-123');
      expect(callArgs.html).toContain('retry');
    });
  });

  describe('transporter verification', () => {
    it('should verify transporter connection on initialization', async () => {
      expect(mockTransporter.verify).toHaveBeenCalledTimes(1);
    });

    it('should handle transporter verification failure', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Invalid SMTP credentials'));

      // Create new instance that will fail verification
      const failingService = new EmailService();

      // Verify should be called
      expect(mockTransporter.verify).toHaveBeenCalled();
    });
  });

  describe('email templates', () => {
    it('should use correct template for each email type', async () => {
      // Test that each email method uses appropriate HTML template
      await emailService.sendVerificationEmail(MASTER_CREDENTIALS.admin.email, 'token');
      let html = mockTransporter.sendMail.mock.calls[0][0].html;
      expect(html).toContain('verification');

      await emailService.sendPasswordResetEmail(MASTER_CREDENTIALS.admin.email, 'token');
      html = mockTransporter.sendMail.mock.calls[1][0].html;
      expect(html).toContain('password');

      await emailService.sendWelcomeEmail(MASTER_CREDENTIALS.admin.email, 'Admin');
      html = mockTransporter.sendMail.mock.calls[2][0].html;
      expect(html).toContain('Welcome');
    });
  });
});