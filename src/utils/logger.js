// Error logging utility for development and production
class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  // Log errors - in development, use console, in production send to service
  error(message, error = null, context = {}) {
    const logData = {
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : null,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    if (this.isDevelopment) {
      console.error(message, error, context);
    } else {
      // TODO: Send to error logging service (e.g., Sentry, LogRocket, etc.)
      // this.sendToService(logData);
      console.error(message, error); // Fallback for production
    }
  }

  // Log warnings
  warn(message, context = {}) {
    if (this.isDevelopment) {
      console.warn(message, context);
    }
  }

  // Log info
  info(message, context = {}) {
    if (this.isDevelopment) {
      console.info(message, context);
    }
  }

  // Send to error logging service (implement based on your service)
  sendToService(logData) {
    // Example implementation:
    // fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(logData)
    // }).catch(() => {
    //   // Fallback if logging service fails
    // });
  }
}

const logger = new Logger();
export default logger;