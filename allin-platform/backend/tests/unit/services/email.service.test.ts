// Mock dependencies before any imports
const mockTransporter = {
  sendMail: jest.fn(),
};

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter),
}));

jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { emailService } from '../../../src/services/email.service';
import { logger } from '../../../src/utils/logger';

const mockLogger = logger as jest.Mocked<typeof logger>;

// Master test credentials
const MASTER_CREDENTIALS = {
  admin: { email: 'admin@allin.demo', password: 'AdminPass123' },
  agency: { email: 'agency@allin.demo', password: 'AgencyPass123' },
  manager: { email: 'manager@allin.demo', password: 'ManagerPass123' },
  creator: { email: 'creator@allin.demo', password: 'CreatorPass123' },
  client: { email: 'client@allin.demo', password: 'ClientPass123' },
  team: { email: 'team@allin.demo', password: 'TeamPass123' },
};

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default environment variables
    process.env.NODE_ENV = 'test';
    process.env.EMAIL_FROM = 'test@allin.com';
    process.env.FRONTEND_URL = 'http://localhost:3000';

    // Reset mock return values
    mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.NODE_ENV;
    delete process.env.EMAIL_FROM;
    delete process.env.FRONTEND_URL;
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
        from: 'test@allin.com',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: 'Test content',
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Email sent: test-message-id to admin@allin.demo'
      );
    });

    it('should send email with provided text content', async () => {
      const emailData = {
        to: MASTER_CREDENTIALS.manager.email,
        subject: 'Plain Text Email',
        html: '<p>HTML content</p>',
        text: 'Plain text content',
      };

      await emailService.sendEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@allin.com',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      });
    });

    it('should use default from address when EMAIL_FROM is not set', async () => {
      delete process.env.EMAIL_FROM;
      
      const emailData = {
        to: MASTER_CREDENTIALS.client.email,
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      await emailService.sendEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'AllIN Platform <noreply@allin.com>',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: 'Test content',
      });
    });

    it('should log preview URL in development mode', async () => {
      process.env.NODE_ENV = 'development';
      
      const emailData = {
        to: MASTER_CREDENTIALS.team.email,
        subject: 'Dev Email',
        html: '<p>Development test</p>',
      };

      await emailService.sendEmail(emailData);

      expect(mockLogger.info).toHaveBeenCalledWith('Preview URL: http://localhost:8025');
    });

    it('should handle email send failure gracefully', async () => {
      const emailData = {
        to: MASTER_CREDENTIALS.creator.email,
        subject: 'Failed Email',
        html: '<p>This will fail</p>',
      };

      const error = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(emailService.sendEmail(emailData)).rejects.toThrow('Failed to send email');
      
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to send email:', error);
    });

    it('should strip HTML tags for text when text is not provided', async () => {
      const emailData = {
        to: MASTER_CREDENTIALS.admin.email,
        subject: 'HTML Stripping Test',
        html: '<h1>Title</h1><p>Paragraph with   multiple   spaces</p><strong>Bold text</strong>',
      };

      await emailService.sendEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@allin.com',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: 'TitleParagraph with multiple spacesBold text',
      });
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email to admin', async () => {
      const email = MASTER_CREDENTIALS.admin.email;
      const token = 'verification-token-123';

      await emailService.sendVerificationEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@allin.com',
        to: email,
        subject: 'Verify your AllIN email address',
        html: expect.stringContaining('Welcome to AllIN! 🚀'),
        text: expect.any(String),
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('http://localhost:3000/auth/verify-email?token=verification-token-123');
      expect(callArgs.html).toContain('Verify Email Address');
      expect(callArgs.html).toContain('This link will expire in 24 hours');
    });

    it('should send verification email to agency owner', async () => {
      const email = MASTER_CREDENTIALS.agency.email;
      const token = 'agency-verification-456';

      await emailService.sendVerificationEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe(email);
      expect(callArgs.subject).toBe('Verify your AllIN email address');
      expect(callArgs.html).toContain(token);
    });

    it('should handle missing FRONTEND_URL gracefully', async () => {
      delete process.env.FRONTEND_URL;
      
      await emailService.sendVerificationEmail('test@example.com', 'token');

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('undefined/auth/verify-email?token=token');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email to creator', async () => {
      const email = MASTER_CREDENTIALS.creator.email;
      const token = 'reset-token-789';

      await emailService.sendPasswordResetEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@allin.com',
        to: email,
        subject: 'Reset your AllIN password',
        html: expect.stringContaining('Password Reset Request 🔐'),
        text: expect.any(String),
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('http://localhost:3000/auth/reset-password?token=reset-token-789');
      expect(callArgs.html).toContain('Reset Password');
      expect(callArgs.html).toContain('This link will expire in 1 hour');
      expect(callArgs.html).toContain('Security Notice');
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
    it('should send welcome email with user name', async () => {
      const email = MASTER_CREDENTIALS.admin.email;
      const name = 'Admin User';

      await emailService.sendWelcomeEmail(email, name);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@allin.com',
        to: email,
        subject: 'Welcome to AllIN! 🎆',
        html: expect.stringContaining('Welcome to AllIN, Admin User! 🎉'),
        text: expect.any(String),
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('http://localhost:3000/auth/login');
      expect(callArgs.html).toContain('Go to Dashboard');
      expect(callArgs.html).toContain('Connect multiple social media accounts');
      expect(callArgs.html).toContain('Generate AI-powered content');
      expect(callArgs.html).toContain('Schedule posts across all platforms');
    });

    it('should send welcome email without user name', async () => {
      const email = MASTER_CREDENTIALS.agency.email;

      await emailService.sendWelcomeEmail(email);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe(email);
      expect(callArgs.html).toContain('Welcome to AllIN, there! 🎉');
    });
  });

  describe('stripHtml utility', () => {
    it('should strip HTML tags and normalize whitespace', async () => {
      const htmlWithComplexStructure = `
        <div>
          <h1>Title</h1>
          <p>Paragraph with   multiple   spaces</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      `;

      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: htmlWithComplexStructure,
      });

      const textContent = mockTransporter.sendMail.mock.calls[0][0].text;
      expect(textContent).toBe('Title Paragraph with multiple spaces Item 1 Item 2');
      expect(textContent).not.toContain('<');
      expect(textContent).not.toContain('>');
    });
  });
});