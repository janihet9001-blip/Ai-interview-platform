export class ErrorHandler {
  static handle(error, context) {
    console.error(`Error in ${context}:`, error);
    
    // Log to monitoring service (optional)
    if (import.meta.env.PROD) {
      // Send to your error tracking service
    }
    
    // User-friendly messages
    if (error.response?.status === 401) {
      return 'Session expired. Please login again.';
    }
    if (error.response?.status === 403) {
      return 'You don\'t have permission for this action.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please check your connection.';
    }
    if (error.message?.includes('Network Error')) {
      return 'Network error. Please check your internet connection.';
    }
    
    return 'Something went wrong. Please try again.';
  }
}