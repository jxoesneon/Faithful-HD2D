import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ToastNotification, ToastType, ToastCategory } from '../types';
import { X, AlertTriangle, CheckCircle, Info, Skull, Zap, Filter } from 'lucide-react';

let notificationIdCounter = 0;
function generateId(): string {
  return `ntf-${++notificationIdCounter}-${Date.now()}`;
}

/**
 * Central notification queue and persistent log manager.
 * Instantiate once and pass to the `<NotificationSystem />` component.
 */
export class NotificationManager {
  private toasts: ToastNotification[] = [];
  private log: ToastNotification[] = [];
  private listeners = new Set<() => void>();
  private pauseListeners = new Set<(paused: boolean) => void>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private isPaused = false;

  /**
   * Emit a new toast notification.
   * Returns the assigned toast id.
   */
  notify(data: Omit<ToastNotification, 'id' | 'timestamp'>): string {
    const id = generateId();
    const toast: ToastNotification = {
      ...data,
      id,
      timestamp: Date.now(),
    };
    this.toasts.unshift(toast);
    this.log.unshift(toast);

    // Keep log bounded
    if (this.log.length > 500) this.log.pop();

    this.emit();

    if (toast.pauseGame) {
      this.setPaused(true);
    }

    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        this.dismiss(id);
      }, toast.duration);
      this.timers.set(id, timer);
    }

    return id;
  }

  /** Remove a specific toast by id. */
  dismiss(id: string): void {
    const idx = this.toasts.findIndex((t) => t.id === id);
    if (idx >= 0) {
      this.toasts.splice(idx, 1);
    }
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.emit();
  }

  /** Clear all visible toasts (log remains). */
  clearToasts(): void {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.toasts = [];
    this.emit();
  }

  /** Clear the persistent log. */
  clearLog(): void {
    this.log = [];
    this.emit();
  }

  /** Get current visible toasts. */
  getToasts(): ToastNotification[] {
    return [...this.toasts];
  }

  /** Get persistent log, optionally filtered by type or category. */
  getLog(filter?: { type?: ToastType; category?: ToastCategory }): ToastNotification[] {
    if (!filter) return [...this.log];
    return this.log.filter((t) => {
      if (filter.type && t.type !== filter.type) return false;
      if (filter.category && t.category !== filter.category) return false;
      return true;
    });
  }

  /** Subscribe to any queue change. Returns unsubscribe function. */
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Subscribe to pause-state changes. */
  onPauseChange(fn: (paused: boolean) => void): () => void {
    this.pauseListeners.add(fn);
    return () => this.pauseListeners.delete(fn);
  }

  /** Programmatically release a critical pause. */
  resume(): void {
    this.setPaused(false);
  }

  get paused(): boolean {
    return this.isPaused;
  }

  private setPaused(val: boolean): void {
    if (this.isPaused === val) return;
    this.isPaused = val;
    for (const fn of this.pauseListeners) fn(val);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }
}

const TYPE_META: Record<
  ToastType,
  { icon: React.ElementType; color: string; border: string; bg: string }
> = {
  info: { icon: Info, color: 'text-sky-300', border: 'border-sky-500/30', bg: 'bg-sky-950/40' },
  success: { icon: CheckCircle, color: 'text-emerald-300', border: 'border-emerald-500/30', bg: 'bg-emerald-950/40' },
  warning: { icon: AlertTriangle, color: 'text-amber-300', border: 'border-amber-500/30', bg: 'bg-amber-950/40' },
  error: { icon: X, color: 'text-rose-300', border: 'border-rose-500/30', bg: 'bg-rose-950/40' },
  critical: { icon: Skull, color: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-950/60' },
};

const CATEGORY_LABELS: Record<ToastCategory, string> = {
  Economy: 'Economy',
  Combat: 'Combat',
  Diplomacy: 'Diplomacy',
  Divine: 'Divine',
  Ecology: 'Ecology',
  System: 'System',
};

interface NotificationSystemProps {
  manager: NotificationManager;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
}

/**
 * React toast notification UI with persistent log drawer.
 */
export function NotificationSystem({
  manager,
  position = 'top-right',
  maxVisible = 5,
}: NotificationSystemProps) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [filterType, setFilterType] = useState<ToastType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ToastCategory | 'all'>('all');
  const [paused, setPaused] = useState(manager.paused);
  const dismissRef = useRef<(id: string) => void>();

  useEffect(() => {
    const unsub = manager.subscribe(() => {
      setToasts(manager.getToasts().slice(0, maxVisible));
    });
    const unsubPause = manager.onPauseChange((p) => setPaused(p));
    return () => {
      unsub();
      unsubPause();
    };
  }, [manager, maxVisible]);

  const handleDismiss = useCallback(
    (id: string) => {
      manager.dismiss(id);
    },
    [manager]
  );
  dismissRef.current = handleDismiss;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const log = manager.getLog({
    type: filterType === 'all' ? undefined : filterType,
    category: filterCategory === 'all' ? undefined : filterCategory,
  });

  return (
    <>
      {/* Toast Stack */}
      <div className={`fixed ${positionClasses[position]} z-[9990] flex flex-col gap-2 w-80 pointer-events-none`}>
        <AnimatePresence>
          {toasts.map((toast) => {
            const meta = TYPE_META[toast.type];
            const Icon = meta.icon;
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`
                  pointer-events-auto
                  backdrop-blur-xl border rounded-xl shadow-2xl
                  ${meta.border} ${meta.bg}
                  p-3 flex flex-col gap-1
                `}
              >
                <div className="flex items-start gap-2">
                  <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${meta.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${meta.color}`}>{toast.title}</div>
                    <div className="text-xs text-slate-300 leading-snug">{toast.message}</div>
                    <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                      {CATEGORY_LABELS[toast.category]} &middot; {new Date(toast.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDismiss(toast.id)}
                    className="text-slate-400 hover:text-white transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {toast.actions && toast.actions.length > 0 && (
                  <div className="flex gap-2 mt-1">
                    {toast.actions.map((a) => (
                      <button
                        key={a.label}
                        onClick={() => {
                          a.callback();
                          handleDismiss(toast.id);
                        }}
                        className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs text-slate-200 transition-colors"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Log Toggle */}
        <button
          onClick={() => setLogOpen((v) => !v)}
          className="pointer-events-auto self-end flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900/70 border border-white/10 text-xs text-slate-300 hover:bg-slate-800/80 transition-colors"
        >
          <Filter className="w-3.5 h-3.5" />
          Log ({manager.getLog().length})
        </button>
      </div>

      {/* Persistent Log Panel */}
      <AnimatePresence>
        {logOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`fixed ${positionClasses[position]} z-[9989] mt-12 w-80 max-h-96 flex flex-col`}
            style={{ marginTop: '4.5rem' }}
          >
            <div className="backdrop-blur-xl bg-slate-950/80 border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Notification Log</span>
                <button onClick={() => manager.clearLog()} className="text-[10px] text-slate-500 hover:text-slate-300">
                  Clear
                </button>
              </div>
              <div className="flex gap-2 px-3 py-2 border-b border-white/5">
                <select
                  className="bg-slate-900/60 border border-white/10 rounded text-xs text-slate-300 px-1 py-0.5"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                >
                  <option value="all">All Types</option>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="critical">Critical</option>
                </select>
                <select
                  className="bg-slate-900/60 border border-white/10 rounded text-xs text-slate-300 px-1 py-0.5"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as any)}
                >
                  <option value="all">All Categories</option>
                  {Object.keys(CATEGORY_LABELS).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="overflow-y-auto custom-scrollbar p-2 space-y-1 max-h-72">
                {log.length === 0 && <div className="text-xs text-slate-500 text-center py-4">No messages</div>}
                {log.map((entry) => {
                  const meta = TYPE_META[entry.type];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={entry.id}
                      className={`flex gap-2 rounded-lg px-2 py-1.5 text-xs ${meta.bg} border ${meta.border}`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${meta.color}`} />
                      <div className="min-w-0">
                        <div className={`font-medium ${meta.color}`}>{entry.title}</div>
                        <div className="text-slate-400 truncate">{entry.message}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Critical Pause Overlay */}
      <AnimatePresence>
        {paused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9995] bg-black/60 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-slate-950/90 border border-red-500/30 rounded-2xl p-6 max-w-sm text-center shadow-2xl"
            >
              <Skull className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-red-300 mb-1">Critical Alert</h2>
              <p className="text-sm text-slate-400 mb-4">Game is paused due to a critical event.</p>
              <button
                onClick={() => manager.resume()}
                className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-sm font-medium transition-colors"
              >
                Resume
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
