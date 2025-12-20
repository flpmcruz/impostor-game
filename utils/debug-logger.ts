/**
 * Debug logging system for diagnosing initialization issues
 * Logs are stored in memory and can be exported from Settings
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const DEBUG_LOGS_KEY = 'impostor_debug_logs';
const MAX_LOGS = 200;
const MAX_LOG_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  data?: unknown;
}

// In-memory log buffer
let logs: LogEntry[] = [];
let isInitialized = false;

/**
 * Format timestamp for logs
 */
function getTimestamp(): string {
  const now = new Date();
  return now.toISOString();
}

/**
 * Add a log entry
 */
function addLog(level: LogEntry['level'], category: string, message: string, data?: unknown): void {
  const entry: LogEntry = {
    timestamp: getTimestamp(),
    level,
    category,
    message,
    data: data !== undefined ? JSON.parse(JSON.stringify(data)) : undefined,
  };

  logs.push(entry);

  // Keep logs within limit
  if (logs.length > MAX_LOGS) {
    logs = logs.slice(-MAX_LOGS);
  }

  // Also log to console in development
  if (__DEV__) {
    const prefix = `[${entry.category}]`;
    switch (level) {
      case 'error':
        console.error(prefix, message, data ?? '');
        break;
      case 'warn':
        console.warn(prefix, message, data ?? '');
        break;
      default:
        console.log(prefix, message, data ?? '');
    }
  }
}

/**
 * Debug logger with categorized logging
 */
export const debugLog = {
  info: (category: string, message: string, data?: unknown) => addLog('info', category, message, data),
  warn: (category: string, message: string, data?: unknown) => addLog('warn', category, message, data),
  error: (category: string, message: string, data?: unknown) => addLog('error', category, message, data),
  debug: (category: string, message: string, data?: unknown) => addLog('debug', category, message, data),
};

/**
 * Initialize the debug logger (load persisted logs)
 */
export async function initDebugLogger(): Promise<void> {
  if (isInitialized) return;

  try {
    const saved = await AsyncStorage.getItem(DEBUG_LOGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as LogEntry[];
      // Filter out old logs
      const cutoff = Date.now() - MAX_LOG_AGE_MS;
      const recentLogs = parsed.filter(log => {
        const logTime = new Date(log.timestamp).getTime();
        return logTime > cutoff;
      });
      logs = recentLogs;
    }
  } catch {
    // Start with empty logs if loading fails
    logs = [];
  }

  isInitialized = true;
  debugLog.info('Logger', 'Debug logger initialized', { existingLogs: logs.length });
}

/**
 * Persist logs to storage (call periodically or on important events)
 */
export async function persistLogs(): Promise<void> {
  try {
    await AsyncStorage.setItem(DEBUG_LOGS_KEY, JSON.stringify(logs));
  } catch {
    // Ignore persistence errors
  }
}

/**
 * Get all logs as a formatted string for export
 */
export function getLogsAsString(): string {
  const header = `=== Impostor App Debug Logs ===\n`;
  const timestamp = `Generated: ${new Date().toISOString()}\n`;
  const deviceInfo = `Logs count: ${logs.length}\n`;
  const separator = '='.repeat(40) + '\n\n';

  const logLines = logs.map(log => {
    const time = log.timestamp.split('T')[1]?.split('.')[0] || log.timestamp;
    const dataStr = log.data ? ` | ${JSON.stringify(log.data)}` : '';
    return `[${time}] ${log.level.toUpperCase().padEnd(5)} [${log.category}] ${log.message}${dataStr}`;
  }).join('\n');

  return header + timestamp + deviceInfo + separator + logLines;
}

/**
 * Get logs array (for display in UI)
 */
export function getLogs(): LogEntry[] {
  return [...logs];
}

/**
 * Clear all logs
 */
export async function clearLogs(): Promise<void> {
  logs = [];
  try {
    await AsyncStorage.removeItem(DEBUG_LOGS_KEY);
  } catch {
    // Ignore
  }
  debugLog.info('Logger', 'Logs cleared');
}

/**
 * Log categories for consistent naming
 */
export const LogCategory = {
  INIT: 'Init',
  STORAGE: 'Storage',
  GAME: 'Game',
  CATEGORIES: 'Categories',
  UI: 'UI',
  ERROR: 'Error',
} as const;
