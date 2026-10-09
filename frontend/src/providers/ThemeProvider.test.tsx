/**
 * Component tests for ThemeProvider.
 *
 * Verifies that toggling the theme:
 *  - Applies the `dark` class to `document.documentElement`
 *  - Persists the new theme value to `localStorage`
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from './ThemeProvider';

// ---------------------------------------------------------------------------
// Helper component — exposes theme state and the toggle action
// ---------------------------------------------------------------------------

function ToggleButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button type="button" onClick={toggleTheme}>
        Toggle theme
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Reset DOM and storage between tests
    document.documentElement.classList.remove('dark');
    localStorage.clear();

    // jsdom does not implement window.matchMedia — provide a stub
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders children and exposes a theme value', async () => {
    render(
      <ThemeProvider>
        <ToggleButton />
      </ThemeProvider>,
    );

    // Wait until the mount effect has settled (reads localStorage / OS pref)
    await waitFor(() =>
      expect(screen.getByTestId('current-theme').textContent).toMatch(
        /^(light|dark)$/,
      ),
    );
  });

  it('toggle applies the opposite theme class to document.documentElement and persists to localStorage', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ToggleButton />
      </ThemeProvider>,
    );

    // Wait for mount effect (reads localStorage/OS preference)
    await waitFor(() =>
      expect(screen.getByTestId('current-theme').textContent).toMatch(
        /^(light|dark)$/,
      ),
    );

    const initialTheme = screen.getByTestId('current-theme').textContent as
      | 'light'
      | 'dark';

    // Perform the toggle
    await user.click(screen.getByRole('button', { name: /toggle theme/i }));

    const newTheme = screen.getByTestId('current-theme').textContent as
      | 'light'
      | 'dark';

    // Theme must have changed
    expect(newTheme).not.toBe(initialTheme);

    // localStorage must be updated to the new theme
    expect(localStorage.getItem('theme')).toBe(newTheme);

    // document.documentElement must have the `dark` class iff newTheme === 'dark'
    if (newTheme === 'dark') {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    } else {
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    }
  });

  it('starts in dark mode when localStorage has "dark" saved', async () => {
    localStorage.setItem('theme', 'dark');
    render(
      <ThemeProvider>
        <ToggleButton />
      </ThemeProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('current-theme').textContent).toBe('dark'),
    );

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('starts in light mode when localStorage has "light" saved', async () => {
    localStorage.setItem('theme', 'light');
    render(
      <ThemeProvider>
        <ToggleButton />
      </ThemeProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('current-theme').textContent).toBe('light'),
    );

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
