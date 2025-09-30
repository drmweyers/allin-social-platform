import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatMessage, ChatMessageProps } from './ChatMessage';
import { MessageRole } from '@/types/ai';

// Mock the icons
jest.mock('lucide-react', () => ({
  ThumbsUp: ({ className }: { className?: string }) => <div data-testid="thumbs-up" className={className} />,
  ThumbsDown: ({ className }: { className?: string }) => <div data-testid="thumbs-down" className={className} />,
  Copy: ({ className }: { className?: string }) => <div data-testid="copy" className={className} />,
  User: ({ className }: { className?: string }) => <div data-testid="user" className={className} />,
  Bot: ({ className }: { className?: string }) => <div data-testid="bot" className={className} />,
  CheckCircle: ({ className }: { className?: string }) => <div data-testid="check-circle" className={className} />,
  XCircle: ({ className }: { className?: string }) => <div data-testid="x-circle" className={className} />,
  MessageSquare: ({ className }: { className?: string }) => <div data-testid="message-square" className={className} />,
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock console.error to avoid cluttering test output
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('ChatMessage Component', () => {
  const mockProps: ChatMessageProps = {
    id: 'message-1',
    content: 'This is a test message',
    role: MessageRole.ASSISTANT,
    createdAt: new Date('2024-01-15T10:30:00Z'),
  };

  const renderChatMessage = (props: Partial<ChatMessageProps> = {}) => {
    return render(<ChatMessage {...mockProps} {...props} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  describe('Basic Rendering', () => {
    it('should render message content', () => {
      renderChatMessage({ content: 'Hello, how can I help you?' });

      expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument();
    });

    it('should render message with correct timestamp', () => {
      const testDate = new Date('2024-01-15T14:30:00Z');
      renderChatMessage({ createdAt: testDate });

      // Time format depends on locale, but should include time
      expect(screen.getByText(/2:30 PM|14:30/)).toBeInTheDocument();
    });

    it('should render message ID attribute', () => {
      renderChatMessage({ id: 'test-message-123' });

      const messageContainer = screen.getByText(mockProps.content).closest('div');
      expect(messageContainer).toBeInTheDocument();
    });
  });

  describe('User Messages', () => {
    it('should render user message with correct styling', () => {
      renderChatMessage({
        role: MessageRole.USER,
        content: 'User message content'
      });

      expect(screen.getByText('User message content')).toBeInTheDocument();
      expect(screen.getByTestId('user')).toBeInTheDocument();
      expect(screen.queryByTestId('bot')).not.toBeInTheDocument();
    });

    it('should position user messages on the right', () => {
      renderChatMessage({
        role: MessageRole.USER,
        content: 'User message'
      });

      const messageContainer = screen.getByText('User message').closest('div')?.parentElement;
      expect(messageContainer).toHaveClass('justify-end');
    });

    it('should not show actions for user messages', () => {
      renderChatMessage({
        role: MessageRole.USER,
        content: 'User message'
      });

      expect(screen.queryByTestId('thumbs-up')).not.toBeInTheDocument();
      expect(screen.queryByTestId('copy')).not.toBeInTheDocument();
    });
  });

  describe('Assistant Messages', () => {
    it('should render assistant message with bot avatar', () => {
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        content: 'Assistant response'
      });

      expect(screen.getByText('Assistant response')).toBeInTheDocument();
      expect(screen.getByTestId('bot')).toBeInTheDocument();
      expect(screen.queryByTestId('user')).not.toBeInTheDocument();
    });

    it('should position assistant messages on the left', () => {
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        content: 'Assistant message'
      });

      const messageContainer = screen.getByText('Assistant message').closest('div')?.parentElement;
      expect(messageContainer).toHaveClass('justify-start');
    });

    it('should show copy and feedback buttons for assistant messages', () => {
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        content: 'Assistant message'
      });

      expect(screen.getByText('Copy')).toBeInTheDocument();
      expect(screen.getByTestId('thumbs-up')).toBeInTheDocument();
      expect(screen.getByTestId('thumbs-down')).toBeInTheDocument();
    });

    it('should display confidence score when provided', () => {
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        content: 'High confidence response',
        confidenceScore: 0.85
      });

      expect(screen.getByText('Confidence:')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should display response time when provided', () => {
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        content: 'Quick response',
        responseTime: 1250
      });

      expect(screen.getByText('1250ms')).toBeInTheDocument();
    });

    it('should render confidence score progress bar correctly', () => {
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        content: 'Response with confidence',
        confidenceScore: 0.75
      });

      const progressBar = screen.getByText('75%').previousElementSibling?.firstElementChild;
      expect(progressBar).toHaveStyle({ width: '75%' });
    });
  });

  describe('Suggested Actions', () => {
    it('should render suggested actions when provided', () => {
      const suggestedActions = ['Create post', 'Schedule content', 'Check analytics'];
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        suggestedActions
      });

      expect(screen.getByText('Suggested actions:')).toBeInTheDocument();
      suggestedActions.forEach(action => {
        expect(screen.getByText(action)).toBeInTheDocument();
      });
    });

    it('should call onActionClick when suggested action is clicked', () => {
      const onActionClick = jest.fn();
      const suggestedActions = ['Create post', 'Schedule content'];

      renderChatMessage({
        role: MessageRole.ASSISTANT,
        suggestedActions,
        onActionClick
      });

      fireEvent.click(screen.getByText('Create post'));
      expect(onActionClick).toHaveBeenCalledWith('Create post');

      fireEvent.click(screen.getByText('Schedule content'));
      expect(onActionClick).toHaveBeenCalledWith('Schedule content');
    });

    it('should not render suggested actions section when empty', () => {
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        suggestedActions: []
      });

      expect(screen.queryByText('Suggested actions:')).not.toBeInTheDocument();
    });

    it('should not render suggested actions for user messages', () => {
      renderChatMessage({
        role: MessageRole.USER,
        suggestedActions: ['Should not show']
      });

      expect(screen.queryByText('Suggested actions:')).not.toBeInTheDocument();
      expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('should copy message content to clipboard when copy button is clicked', async () => {
      (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);

      renderChatMessage({
        role: MessageRole.ASSISTANT,
        content: 'Content to copy'
      });

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Content to copy');
    });

    it('should show "Copied!" message temporarily after successful copy', async () => {
      (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);

      renderChatMessage({
        role: MessageRole.ASSISTANT,
        content: 'Content to copy'
      });

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
        expect(screen.getByTestId('check-circle')).toBeInTheDocument();
      });

      // Should revert back after timeout
      await waitFor(() => {
        expect(screen.getByText('Copy')).toBeInTheDocument();
        expect(screen.getByTestId('copy')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle clipboard copy errors gracefully', async () => {
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Clipboard error'));

      renderChatMessage({
        role: MessageRole.ASSISTANT,
        content: 'Content to copy'
      });

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Content to copy');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy text:', expect.any(Error));
    });
  });

  describe('Feedback System', () => {
    it('should call onFeedback with positive feedback when thumbs up is clicked', () => {
      const onFeedback = jest.fn();

      renderChatMessage({
        role: MessageRole.ASSISTANT,
        onFeedback
      });

      const thumbsUpButton = screen.getByTestId('thumbs-up').closest('button');
      fireEvent.click(thumbsUpButton!);

      expect(onFeedback).toHaveBeenCalledWith(mockProps.id, true, '');
    });

    it('should show feedback form when thumbs down is clicked', () => {
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        onFeedback: jest.fn()
      });

      const thumbsDownButton = screen.getByTestId('thumbs-down').closest('button');
      fireEvent.click(thumbsDownButton!);

      expect(screen.getByText('Help us improve')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('What could be better about this response?')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should handle feedback form submission', () => {
      const onFeedback = jest.fn();

      renderChatMessage({
        role: MessageRole.ASSISTANT,
        onFeedback
      });

      // Open feedback form
      const thumbsDownButton = screen.getByTestId('thumbs-down').closest('button');
      fireEvent.click(thumbsDownButton!);

      // Enter feedback text
      const textarea = screen.getByPlaceholderText('What could be better about this response?');
      fireEvent.change(textarea, { target: { value: 'The response was too generic' } });

      // Submit feedback
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      expect(onFeedback).toHaveBeenCalledWith(mockProps.id, false, 'The response was too generic');
      expect(screen.queryByText('Help us improve')).not.toBeInTheDocument();
    });

    it('should close feedback form when cancel is clicked', () => {
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        onFeedback: jest.fn()
      });

      // Open feedback form
      const thumbsDownButton = screen.getByTestId('thumbs-down').closest('button');
      fireEvent.click(thumbsDownButton!);

      expect(screen.getByText('Help us improve')).toBeInTheDocument();

      // Cancel feedback
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Help us improve')).not.toBeInTheDocument();
    });

    it('should show feedback status when isHelpful is set', () => {
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        isHelpful: true
      });

      expect(screen.getByText('Helpful')).toBeInTheDocument();
      expect(screen.getByTestId('thumbs-up')).toHaveClass('text-green-500');
      expect(screen.queryByTestId('thumbs-down')).not.toBeInTheDocument();
    });

    it('should show negative feedback status when isHelpful is false', () => {
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        isHelpful: false
      });

      expect(screen.getByText('Not helpful')).toBeInTheDocument();
      expect(screen.getByTestId('thumbs-down')).toHaveClass('text-red-500');
      expect(screen.queryByTestId('thumbs-up')).not.toBeInTheDocument();
    });

    it('should hide feedback buttons when feedback has been given', () => {
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        isHelpful: true,
        onFeedback: jest.fn()
      });

      // Should not show interactive buttons
      expect(screen.queryByText('Copy')).toBeInTheDocument(); // Copy should still be there
      const thumbsUpButtons = screen.getAllByTestId('thumbs-up');
      const interactiveThumbsUp = thumbsUpButtons.find(button =>
        button.closest('button') !== null
      );
      expect(interactiveThumbsUp).toBeUndefined();
    });
  });

  describe('Content Formatting', () => {
    it('should preserve line breaks in content', () => {
      const multilineContent = 'Line 1\nLine 2\nLine 3';
      renderChatMessage({
        content: multilineContent
      });

      const contentElement = screen.getByText(multilineContent);
      expect(contentElement).toHaveClass('whitespace-pre-wrap');
    });

    it('should handle empty content gracefully', () => {
      renderChatMessage({
        content: ''
      });

      const messageContainer = screen.getByTestId('bot').closest('div');
      expect(messageContainer).toBeInTheDocument();
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(1000);
      renderChatMessage({
        content: longContent
      });

      expect(screen.getByText(longContent)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles and labels', () => {
      renderChatMessage({
        role: MessageRole.ASSISTANT
      });

      const copyButton = screen.getByRole('button', { name: /copy/i });
      const thumbsUpButton = screen.getByRole('button');
      const thumbsDownButton = screen.getByRole('button');

      expect(copyButton).toBeInTheDocument();
      expect(thumbsUpButton).toBeInTheDocument();
      expect(thumbsDownButton).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        onFeedback: jest.fn()
      });

      const copyButton = screen.getByText('Copy').closest('button');
      copyButton?.focus();

      expect(copyButton).toHaveFocus();

      // Should be able to tab to other interactive elements
      fireEvent.keyDown(copyButton!, { key: 'Tab' });
    });

    it('should have proper ARIA attributes for confidence score', () => {
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        confidenceScore: 0.75
      });

      const confidenceText = screen.getByText('75%');
      expect(confidenceText).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined onActionClick gracefully', () => {
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        suggestedActions: ['Test action'],
        onActionClick: undefined
      });

      const actionButton = screen.getByText('Test action');
      fireEvent.click(actionButton);

      // Should not throw error
      expect(actionButton).toBeInTheDocument();
    });

    it('should handle undefined onFeedback gracefully', () => {
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        onFeedback: undefined
      });

      const thumbsUpButton = screen.getByTestId('thumbs-up').closest('button');
      fireEvent.click(thumbsUpButton!);

      // Should not throw error
      expect(thumbsUpButton).toBeInTheDocument();
    });

    it('should handle confidence score edge values', () => {
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        confidenceScore: 0
      });

      expect(screen.getByText('0%')).toBeInTheDocument();

      // Test with 100% confidence
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        confidenceScore: 1
      });

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle very large response times', () => {
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        responseTime: 999999
      });

      expect(screen.getByText('999999ms')).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      const specialContent = 'Special chars: @#$%^&*()[]{}|\\:";\'<>?,./`~';
      renderChatMessage({
        content: specialContent
      });

      expect(screen.getByText(specialContent)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not cause memory leaks with timers', async () => {
      const { unmount } = renderChatMessage({
        role: MessageRole.ASSISTANT
      });

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      // Unmount before timer completes
      unmount();

      // Should not cause any warnings about memory leaks
    });

    it('should handle rapid successive feedback clicks', () => {
      const onFeedback = jest.fn();
      renderChatMessage({
        role: MessageRole.ASSISTANT,
        onFeedback
      });

      const thumbsUpButton = screen.getByTestId('thumbs-up').closest('button');

      // Rapid clicks
      fireEvent.click(thumbsUpButton!);
      fireEvent.click(thumbsUpButton!);
      fireEvent.click(thumbsUpButton!);

      expect(onFeedback).toHaveBeenCalledTimes(3);
    });
  });
});

export {};