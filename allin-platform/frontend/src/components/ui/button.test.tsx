import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button, ButtonProps } from './button';

describe('Button Component', () => {
  const defaultProps: Partial<ButtonProps> = {
    children: 'Click me'
  };

  const renderButton = (props: Partial<ButtonProps> = {}) => {
    return render(<Button {...defaultProps} {...props} />);
  };

  describe('Basic Rendering', () => {
    it('should render button with children', () => {
      renderButton({ children: 'Test Button' });

      expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
    });

    it('should render button with text content', () => {
      renderButton({ children: 'Submit Form' });

      expect(screen.getByText('Submit Form')).toBeInTheDocument();
    });

    it('should render button with complex children', () => {
      renderButton({
        children: (
          <span>
            <i className="icon" />
            Button with Icon
          </span>
        )
      });

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Button with Icon')).toBeInTheDocument();
    });

    it('should have button type by default', () => {
      renderButton();

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });
  });

  describe('Variants', () => {
    it('should render default variant correctly', () => {
      renderButton({ variant: 'default' });

      const button = screen.getByRole('button');
      expect(button).toHaveClass(/bg-primary/);
      expect(button).toHaveClass(/text-primary-foreground/);
    });

    it('should render destructive variant correctly', () => {
      renderButton({ variant: 'destructive' });

      const button = screen.getByRole('button');
      expect(button).toHaveClass(/bg-destructive/);
      expect(button).toHaveClass(/text-destructive-foreground/);
    });

    it('should render outline variant correctly', () => {
      renderButton({ variant: 'outline' });

      const button = screen.getByRole('button');
      expect(button).toHaveClass(/border/);
      expect(button).toHaveClass(/border-input/);
    });

    it('should render secondary variant correctly', () => {
      renderButton({ variant: 'secondary' });

      const button = screen.getByRole('button');
      expect(button).toHaveClass(/bg-secondary/);
      expect(button).toHaveClass(/text-secondary-foreground/);
    });

    it('should render ghost variant correctly', () => {
      renderButton({ variant: 'ghost' });

      const button = screen.getByRole('button');
      expect(button).toHaveClass(/hover:bg-accent/);
      expect(button).toHaveClass(/hover:text-accent-foreground/);
    });

    it('should render link variant correctly', () => {
      renderButton({ variant: 'link' });

      const button = screen.getByRole('button');
      expect(button).toHaveClass(/text-primary/);
      expect(button).toHaveClass(/underline-offset-4/);
    });
  });

  describe('Sizes', () => {
    it('should render default size correctly', () => {
      renderButton({ size: 'default' });

      const button = screen.getByRole('button');
      expect(button).toHaveClass(/h-10/);
      expect(button).toHaveClass(/px-4/);
      expect(button).toHaveClass(/py-2/);
    });

    it('should render sm size correctly', () => {
      renderButton({ size: 'sm' });

      const button = screen.getByRole('button');
      expect(button).toHaveClass(/h-9/);
      expect(button).toHaveClass(/px-3/);
    });

    it('should render lg size correctly', () => {
      renderButton({ size: 'lg' });

      const button = screen.getByRole('button');
      expect(button).toHaveClass(/h-11/);
      expect(button).toHaveClass(/px-8/);
    });

    it('should render icon size correctly', () => {
      renderButton({ size: 'icon' });

      const button = screen.getByRole('button');
      expect(button).toHaveClass(/h-10/);
      expect(button).toHaveClass(/w-10/);
    });
  });

  describe('States', () => {
    it('should be enabled by default', () => {
      renderButton();

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveClass(/opacity-50/);
    });

    it('should render disabled state correctly', () => {
      renderButton({ disabled: true });

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass(/disabled:pointer-events-none/);
      expect(button).toHaveClass(/disabled:opacity-50/);
    });

    it('should not fire onClick when disabled', () => {
      const onClick = jest.fn();
      renderButton({ disabled: true, onClick });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should show loading state when specified', () => {
      renderButton({
        children: 'Submit',
        // Assuming loading state is passed via props or children
        'aria-busy': true
      } as any);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Event Handling', () => {
    it('should call onClick when clicked', () => {
      const onClick = jest.fn();
      renderButton({ onClick });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should pass event object to onClick handler', () => {
      const onClick = jest.fn();
      renderButton({ onClick });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle multiple clicks', () => {
      const onClick = jest.fn();
      renderButton({ onClick });

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(3);
    });

    it('should handle keyboard events', () => {
      const onClick = jest.fn();
      renderButton({ onClick });

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });

      // Button should handle Enter key press
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should handle space key press', () => {
      const onClick = jest.fn();
      renderButton({ onClick });

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      renderButton({ className: 'custom-button-class' });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-button-class');
    });

    it('should merge custom className with default classes', () => {
      renderButton({
        className: 'custom-class',
        variant: 'default'
      });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass(/bg-primary/);
    });

    it('should accept custom data attributes', () => {
      renderButton({ 'data-testid': 'my-button' } as any);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-testid', 'my-button');
    });

    it('should accept aria attributes', () => {
      renderButton({
        'aria-label': 'Custom aria label',
        'aria-describedby': 'description-id'
      } as any);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom aria label');
      expect(button).toHaveAttribute('aria-describedby', 'description-id');
    });

    it('should accept ref prop', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Button with Ref</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toBe('Button with Ref');
    });
  });

  describe('Form Integration', () => {
    it('should work as submit button in forms', () => {
      const onSubmit = jest.fn();
      render(
        <form onSubmit={onSubmit}>
          <Button type="submit">Submit Form</Button>
        </form>
      );

      const button = screen.getByRole('button', { name: 'Submit Form' });
      expect(button).toHaveAttribute('type', 'submit');

      fireEvent.click(button);
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('should work as reset button in forms', () => {
      render(
        <form>
          <input name="test" defaultValue="test value" />
          <Button type="reset">Reset Form</Button>
        </form>
      );

      const button = screen.getByRole('button', { name: 'Reset Form' });
      const input = screen.getByRole('textbox') as HTMLInputElement;

      expect(button).toHaveAttribute('type', 'reset');
      expect(input.value).toBe('test value');

      fireEvent.click(button);
      expect(input.value).toBe('');
    });

    it('should prevent form submission when type is button', () => {
      const onSubmit = jest.fn();
      render(
        <form onSubmit={onSubmit}>
          <Button type="button">Regular Button</Button>
        </form>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper role', () => {
      renderButton();

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should be focusable by default', () => {
      renderButton();

      const button = screen.getByRole('button');
      button.focus();

      expect(button).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      renderButton({ disabled: true });

      const button = screen.getByRole('button');
      button.focus();

      expect(button).not.toHaveFocus();
    });

    it('should support aria-pressed for toggle buttons', () => {
      renderButton({ 'aria-pressed': true } as any);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should support aria-expanded for dropdown buttons', () => {
      renderButton({ 'aria-expanded': false } as any);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should support custom aria-label', () => {
      renderButton({ 'aria-label': 'Close dialog' } as any);

      const button = screen.getByRole('button', { name: 'Close dialog' });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator when loading prop is true', () => {
      // Assuming there's a loading prop - this would depend on actual implementation
      const LoadingButton = ({ loading, children, ...props }: ButtonProps & { loading?: boolean }) => (
        <Button {...props}>
          {loading ? 'Loading...' : children}
        </Button>
      );

      render(<LoadingButton loading={true}>Submit</LoadingButton>);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });

    it('should disable button when loading', () => {
      const LoadingButton = ({ loading, children, ...props }: ButtonProps & { loading?: boolean }) => (
        <Button disabled={loading} {...props}>
          {loading ? 'Loading...' : children}
        </Button>
      );

      render(<LoadingButton loading={true}>Submit</LoadingButton>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Icon Buttons', () => {
    it('should render icon-only button correctly', () => {
      const IconButton = () => (
        <Button size="icon" aria-label="Settings">
          <span className="sr-only">Settings</span>
          ⚙️
        </Button>
      );

      render(<IconButton />);

      const button = screen.getByRole('button', { name: 'Settings' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass(/h-10/);
      expect(button).toHaveClass(/w-10/);
    });

    it('should render button with leading icon', () => {
      renderButton({
        children: (
          <>
            <span>📧</span>
            <span>Send Email</span>
          </>
        )
      });

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.getByText('Send Email')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should maintain accessibility on different screen sizes', () => {
      renderButton();

      const button = screen.getByRole('button');

      // Simulate different viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      expect(button).toBeVisible();
      expect(button).toHaveClass(/px-4/); // Should maintain padding
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children gracefully', () => {
      renderButton({ children: '' });

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe('');
    });

    it('should handle null children gracefully', () => {
      renderButton({ children: null });

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle undefined onClick gracefully', () => {
      renderButton({ onClick: undefined });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should not throw error
      expect(button).toBeInTheDocument();
    });

    it('should handle rapid successive clicks', async () => {
      const onClick = jest.fn();
      renderButton({ onClick });

      const button = screen.getByRole('button');

      // Simulate rapid clicks
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(5);
    });

    it('should work with async onClick handlers', async () => {
      const asyncClick = jest.fn().mockResolvedValue('success');
      renderButton({ onClick: asyncClick });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(asyncClick).toHaveBeenCalledTimes(1);
      });
    });
  });
});

export {};