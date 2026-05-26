export const validateEnvironment = () => {
  const required = ['VITE_API_URL', 'VITE_WS_URL'];
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing environment variables:', missing);
    return false;
  }
  
  // Validate URLs
  try {
    new URL(import.meta.env.VITE_API_URL);
    new URL(import.meta.env.VITE_WS_URL);
  } catch (e) {
    console.error('Invalid URL in environment variables');
    return false;
  }
  
  return true;
};