import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import React from 'react';
import { NotificationSystem, NotificationManager } from '../NotificationSystem';

describe('NotificationManager', () => {
  it('notifies and assigns id', () => {
    const mgr = new NotificationManager();
    const id = mgr.notify({ type: 'info', category: 'System', title: 'Hello', message: 'World' });
    expect(typeof id).toBe('string');
    expect(mgr.getToasts().length).toBe(1);
    expect(mgr.getLog().length).toBe(1);
  });

  it('dismisses a toast', () => {
    const mgr = new NotificationManager();
    const id = mgr.notify({ type: 'info', category: 'System', title: 'A', message: 'B' });
    mgr.dismiss(id);
    expect(mgr.getToasts().length).toBe(0);
    expect(mgr.getLog().length).toBe(1); // log persists
  });

  it('auto-dismisses after duration', () => {
    vi.useFakeTimers();
    const mgr = new NotificationManager();
    mgr.notify({ type: 'info', category: 'System', title: 'A', message: 'B', duration: 500 });
    expect(mgr.getToasts().length).toBe(1);
    act(() => vi.advanceTimersByTime(600));
    expect(mgr.getToasts().length).toBe(0);
    vi.useRealTimers();
  });

  it('pauses on critical and resumes', () => {
    const mgr = new NotificationManager();
    const fn = vi.fn();
    mgr.onPauseChange(fn);
    mgr.notify({ type: 'critical', category: 'Combat', title: 'DANGER', message: '!', pauseGame: true });
    expect(mgr.paused).toBe(true);
    expect(fn).toHaveBeenCalledWith(true);
    mgr.resume();
    expect(mgr.paused).toBe(false);
    expect(fn).toHaveBeenCalledWith(false);
  });

  it('filters log by type and category', () => {
    const mgr = new NotificationManager();
    mgr.notify({ type: 'success', category: 'Economy', title: 'G', message: 'g' });
    mgr.notify({ type: 'error', category: 'Combat', title: 'B', message: 'b' });
    expect(mgr.getLog({ type: 'success' }).length).toBe(1);
    expect(mgr.getLog({ category: 'Combat' }).length).toBe(1);
    expect(mgr.getLog({ type: 'success', category: 'Combat' }).length).toBe(0);
  });

  it('clears toasts and log', () => {
    const mgr = new NotificationManager();
    mgr.notify({ type: 'info', category: 'System', title: 'A', message: 'B' });
    mgr.clearToasts();
    mgr.clearLog();
    expect(mgr.getToasts().length).toBe(0);
    expect(mgr.getLog().length).toBe(0);
  });
});

describe('NotificationSystem component', () => {
  it('renders a toast', () => {
    const mgr = new NotificationManager();
    render(<NotificationSystem manager={mgr} />);
    act(() => {
      mgr.notify({ type: 'info', category: 'System', title: 'Test', message: 'Message body' });
    });
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Message body')).toBeInTheDocument();
  });

  it('dismisses toast on X click', async () => {
    const mgr = new NotificationManager();
    render(<NotificationSystem manager={mgr} />);
    act(() => {
      mgr.notify({ type: 'info', category: 'System', title: 'DismissMe', message: 'msg' });
    });
    const btn = screen.getAllByLabelText('Dismiss')[0];
    await act(async () => fireEvent.click(btn));
    await waitFor(() => expect(screen.queryByText('DismissMe')).not.toBeInTheDocument());
  });

  it('shows critical pause overlay', async () => {
    const mgr = new NotificationManager();
    render(<NotificationSystem manager={mgr} />);
    act(() => {
      mgr.notify({ type: 'critical', category: 'Combat', title: 'CRIT', message: '!!!', pauseGame: true });
    });
    expect(screen.getByText('Critical Alert')).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByText('Resume')));
    await waitFor(() => expect(screen.queryByText('Critical Alert')).not.toBeInTheDocument());
  });
});
