const getApiBaseUrl = () => {
  // 1. Agar foydalanuvchi o'z server manzilini saqlagan bo'lsa (masalan Render URL)
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('custom_api_url');
    if (savedUrl && savedUrl.trim()) {
      return savedUrl.trim().replace(/\/$/, '');
    }
  }

  // 2. VITE_API_URL o'zgaruvchisi tekshiruvi (bo'sh string bo'lmasligi kerak)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/$/, '');
  }

  // 3. Brauzer hostname tekshiruvi
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    // Lokal Wi-Fi IP (192.168.x.x yoki 10.x.x.x)
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return `http://${hostname}:5000`;
    }
  }

  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();
