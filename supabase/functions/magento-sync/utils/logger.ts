
// Centralized logging utility for consistent logging across the application

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  minLevel: LogLevel;
  includeTimestamp: boolean;
}

// Default configuration
const defaultConfig: LoggerConfig = {
  minLevel: LogLevel.DEBUG,
  includeTimestamp: true
};

// Current configuration
let config = { ...defaultConfig };

/**
 * Configure the logger
 */
export function configureLogger(newConfig: Partial<LoggerConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Format a log message
 */
function formatMessage(level: LogLevel, message: string, context?: Record<string, any>): string {
  const timestamp = config.includeTimestamp ? `[${new Date().toISOString()}]` : '';
  const levelStr = `[${level}]`;
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  
  return `${timestamp}${levelStr} ${message}${contextStr}`;
}

/**
 * Log a debug message
 */
export function debug(message: string, context?: Record<string, any>): void {
  if (shouldLog(LogLevel.DEBUG)) {
    console.debug(formatMessage(LogLevel.DEBUG, message, context));
  }
}

/**
 * Log an info message
 */
export function info(message: string, context?: Record<string, any>): void {
  if (shouldLog(LogLevel.INFO)) {
    console.log(formatMessage(LogLevel.INFO, message, context));
  }
}

/**
 * Log a warning message
 */
export function warn(message: string, context?: Record<string, any>): void {
  if (shouldLog(LogLevel.WARN)) {
    console.warn(formatMessage(LogLevel.WARN, message, context));
  }
}

/**
 * Log an error message
 */
export function error(message: string, error?: Error, context?: Record<string, any>): void {
  if (shouldLog(LogLevel.ERROR)) {
    const errorContext = error 
      ? { ...context, error: error.message, stack: error.stack }
      : context;
    console.error(formatMessage(LogLevel.ERROR, message, errorContext));
  }
}

/**
 * Check if a log level should be logged
 */
function shouldLog(level: LogLevel): boolean {
  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
  const configLevelIndex = levels.indexOf(config.minLevel);
  const messageLevelIndex = levels.indexOf(level);
  
  return messageLevelIndex >= configLevelIndex;
}

/**
 * Create a logger for a specific module
 */
export function createLogger(module: string) {
  return {
    debug: (message: string, context?: Record<string, any>) => 
      debug(`[${module}] ${message}`, context),
    info: (message: string, context?: Record<string, any>) => 
      info(`[${module}] ${message}`, context),
    warn: (message: string, context?: Record<string, any>) => 
      warn(`[${module}] ${message}`, context),
    error: (message: string, error?: Error, context?: Record<string, any>) => 
      error(`[${module}] ${message}`, error, context)
  };
}

// Default logger instance
export default {
  debug,
  info,
  warn,
  error,
  createLogger
};
