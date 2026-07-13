// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import { diagnosticsService } from './diagnostics';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const Bomb = () => {
  throw new Error('boom');
};

describe('ErrorBoundary', () => {
  it('renders the fallback UI instead of an unhandled exception', () => {
    // React logs the caught error to console.error; suppress the noise for this test.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong displaying this page')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reload TaxMate' })).toBeTruthy();
    spy.mockRestore();
  });

  it('renders children normally when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('All good')).toBeTruthy();
    expect(screen.queryByText('Something went wrong displaying this page')).toBeNull();
  });

  it('logs a RENDER_ERROR diagnostic entry when it catches', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    const entries = diagnosticsService.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ code: 'RENDER_ERROR', feature: 'app', severity: 'error' });
    spy.mockRestore();
  });
});
