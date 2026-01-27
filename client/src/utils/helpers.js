/* ========================================
   NEURIAX SALON MANAGER v2.0
   Helpers & Utilities - Premium Functions Library
   PASO 21 - Funciones Reutilizables
   ======================================== */

// ============================================
// CONSTANTES DEL SISTEMA
// ============================================
export const CONSTANTS = {
  APP_NAME: 'NEURIAX',
  APP_SUBTITLE: 'Salon Manager',
  APP_VERSION: '2.0.0',
  CURRENCY: 'EUR',
  CURRENCY_SYMBOL: '€',
  CURRENCY_LOCALE: 'es-ES',
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  
  CITA_ESTADOS: {
    PENDIENTE: 'pendiente',
    CONFIRMADA: 'confirmada',
    EN_PROCESO: 'en_proceso',
    COMPLETADA: 'completada',
    CANCELADA: 'cancelada',
    NO_SHOW: 'no_show'
  },
  
  CAJA_ESTADOS: {
    ABIERTA: 'abierta',
    CERRADA: 'cerrada'
  },
  
  METODOS_PAGO: {
    EFECTIVO: 'efectivo',
    TARJETA: 'tarjeta',
    TRANSFERENCIA: 'transferencia',
    BIZUM: 'bizum',
    MIXTO: 'mixto'
  },
  
  ROLES: {
    ADMIN: 'admin',
    GERENTE: 'gerente',
    EMPLEADO: 'empleado',
    RECEPCION: 'recepcion'
  },
  
  DIAS_SEMANA: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  DIAS_SEMANA_CORTO: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  
  MESES: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  MESES_CORTO: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  
  STATUS_COLORS: {
    pendiente: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
    confirmada: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
    en_proceso: { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' },
    completada: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
    cancelada: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
    no_show: { bg: 'rgba(107, 114, 128, 0.15)', color: '#6b7280' }
  }
};

// ============================================
// STRING UTILITIES
// ============================================

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeWords = (str) => {
  if (!str) return '';
  return str.split(' ').map(word => capitalize(word)).join(' ');
};

export const slug = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export const truncate = (str, length = 100, suffix = '...') => {
  if (!str || str.length <= length) return str;
  return str.substring(0, length).trim() + suffix;
};

export const initials = (name, maxLength = 2) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, maxLength)
    .join('');
};

export const pluralize = (count, singular, plural) => {
  return count === 1 ? singular : (plural || `${singular}s`);
};

export const removeSpaces = (str) => str.replace(/\s/g, '');
export const removeSpecialChars = (str) => str.replace(/[^\w\s]/g, '');
export const reverseString = (str) => str.split('').reverse().join('');
export const countWords = (str) => str.trim().split(/\s+/).length;

export const extractNumbers = (str) => str.match(/\d+/g) || [];
export const extractEmails = (str) => str.match(/[^\s@]+@[^\s@]+\.[^\s@]+/g) || [];

// ============================================
// ARRAY UTILITIES
// ============================================

export const unique = (arr, key) => {
  if (key) {
    return Array.from(new Map(arr.map(item => [item[key], item])).values());
  }
  return [...new Set(arr)];
};

export const flatten = (arr, depth = Infinity) => {
  return arr.reduce((acc, val) => {
    if (Array.isArray(val) && depth > 0) {
      acc.push(...flatten(val, depth - 1));
    } else {
      acc.push(val);
    }
    return acc;
  }, []);
};

export const groupBy = (arr, key) => {
  return arr.reduce((acc, obj) => {
    const group = obj[key];
    acc[group] = acc[group] || [];
    acc[group].push(obj);
    return acc;
  }, {});
};

export const partition = (arr, predicate) => {
  const pass = [];
  const fail = [];
  arr.forEach(item => (predicate(item) ? pass : fail).push(item));
  return [pass, fail];
};

export const chunk = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

export const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const compact = (arr) => arr.filter(item => item != null);
export const difference = (arr1, arr2) => arr1.filter(item => !arr2.includes(item));
export const intersection = (arr1, arr2) => arr1.filter(item => arr2.includes(item));
export const union = (arr1, arr2) => [...new Set([...arr1, ...arr2])];

export const sum = (arr, key) => arr.reduce((acc, item) => acc + (key ? item[key] : item), 0);
export const average = (arr, key) => sum(arr, key) / arr.length;
export const max = (arr, key) => Math.max(...arr.map(item => key ? item[key] : item));
export const min = (arr, key) => Math.min(...arr.map(item => key ? item[key] : item));

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    const comparison = aVal < bVal ? -1 : 1;
    return direction === 'asc' ? comparison : -comparison;
  });
};

export const uniqueBy = (array, key) => {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

// ============================================
// OBJECT UTILITIES
// ============================================

export const merge = (...objects) => {
  return objects.reduce((acc, obj) => ({ ...acc, ...obj }), {});
};

export const pick = (obj, keys) => {
  return keys.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key];
    return acc;
  }, {});
};

export const omit = (obj, keys) => {
  const keysSet = new Set(keys);
  return Object.keys(obj).reduce((acc, key) => {
    if (!keysSet.has(key)) acc[key] = obj[key];
    return acc;
  }, {});
};

export const isObject = (obj) => obj !== null && typeof obj === 'object' && !Array.isArray(obj);

export const deepMerge = (target, source) => {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        output[key] = !(key in target) ? source[key] : deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
};

export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export const invert = (obj) => Object.keys(obj).reduce((acc, key) => {
  acc[obj[key]] = key;
  return acc;
}, {});

export const mapValues = (obj, mapper) => Object.keys(obj).reduce((acc, key) => {
  acc[key] = mapper(obj[key], key);
  return acc;
}, {});

export const filterValues = (obj, predicate) => Object.keys(obj).reduce((acc, key) => {
  if (predicate(obj[key], key)) acc[key] = obj[key];
  return acc;
}, {});

// ============================================
// DATE UTILITIES
// ============================================

export const formatDate = (date, options = {}) => {
  const { format = 'short', locale = CONSTANTS.CURRENCY_LOCALE } = options;
  if (!date) return '';
  
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  
  if (format === 'relative') return getRelativeTime(d);
  
  const formats = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  };
  
  return new Intl.DateTimeFormat(locale, formats[format] || formats.short).format(d);
};

export const formatTime = (date, options = {}) => {
  const { seconds = false, locale = CONSTANTS.CURRENCY_LOCALE } = options;
  if (!date) return '';
  
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    ...(seconds && { second: '2-digit' })
  }).format(d);
};

export const formatDateTime = (date, options = {}) => {
  if (!date) return '';
  return `${formatDate(date, options)} ${formatTime(date, options)}`;
};

export const getRelativeTime = (date) => {
  const now = new Date();
  const d = date instanceof Date ? date : new Date(date);
  const diff = now - d;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  if (days < 7) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
  if (weeks < 4) return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  if (months < 12) return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
  return `Hace ${years} ${years === 1 ? 'año' : 'años'}`;
};

export const isToday = (date) => {
  const today = new Date();
  const d = date instanceof Date ? date : new Date(date);
  return d.toDateString() === today.toDateString();
};

export const isTomorrow = (date) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d = date instanceof Date ? date : new Date(date);
  return d.toDateString() === tomorrow.toDateString();
};

export const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const d = date instanceof Date ? date : new Date(date);
  return d.toDateString() === yesterday.toDateString();
};

export const getDayName = (date, short = false) => {
  const d = date instanceof Date ? date : new Date(date);
  const dayIndex = d.getDay();
  return short ? CONSTANTS.DIAS_SEMANA_CORTO[dayIndex] : CONSTANTS.DIAS_SEMANA[dayIndex];
};

export const getMonthName = (date, short = false) => {
  const d = date instanceof Date ? date : new Date(date);
  const monthIndex = d.getMonth();
  return short ? CONSTANTS.MESES_CORTO[monthIndex] : CONSTANTS.MESES[monthIndex];
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

export const startOfWeek = (date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const endOfWeek = (date) => {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
};

export const startOfMonth = (date) => {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const endOfMonth = (date) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(0);
  result.setHours(23, 59, 59, 999);
  return result;
};

export const getDaysInMonth = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
};

export const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

export const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.toDateString() === d2.toDateString();
};

export const isBetweenDates = (date, startDate, endDate) => {
  const d = new Date(date).getTime();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return d >= start && d <= end;
};

export const dateDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

// ============================================
// NUMBER UTILITIES
// ============================================

export const formatCurrency = (amount, options = {}) => {
  const {
    currency = CONSTANTS.CURRENCY,
    locale = CONSTANTS.CURRENCY_LOCALE,
    showSymbol = true,
    decimals = 2
  } = options;

  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? `0,00 ${CONSTANTS.CURRENCY_SYMBOL}` : '0,00';
  }

  return new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
};

export const parseCurrency = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[€$£¥]/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatNumber = (number, options = {}) => {
  const { locale = CONSTANTS.CURRENCY_LOCALE, decimals = 0, compact = false } = options;
  if (number === null || number === undefined || isNaN(number)) return '0';
  
  if (compact) {
    if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
    if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
  }
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
};

export const abbreviateNumber = (value) => {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
  return value;
};

export const roundTo = (value, decimals) => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

export const isEven = (num) => num % 2 === 0;
export const isOdd = (num) => num % 2 !== 0;
export const isPrime = (num) => {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
};

export const factorial = (num) => {
  if (num <= 1) return 1;
  return num * factorial(num - 1);
};

// ============================================
// FORMATTING UTILITIES
// ============================================

export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('34')) {
    return `+34 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  return phone;
};

export const cleanPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

// ============================================
// VALIDATORS
// ============================================

export const validators = {
  required: (value) => {
    if (value === null || value === undefined) return 'Este campo es requerido';
    if (typeof value === 'string' && !value.trim()) return 'Este campo es requerido';
    if (Array.isArray(value) && value.length === 0) return 'Este campo es requerido';
    return null;
  },

  email: (value) => {
    if (!value) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Email inválido';
  },

  phone: (value) => {
    if (!value) return null;
    const cleaned = value.replace(/\D/g, '');
    return (cleaned.length >= 9 && cleaned.length <= 15) ? null : 'Teléfono inválido';
  },

  minLength: (min) => (value) => {
    if (!value) return null;
    return value.length >= min ? null : `Mínimo ${min} caracteres`;
  },

  maxLength: (max) => (value) => {
    if (!value) return null;
    return value.length <= max ? null : `Máximo ${max} caracteres`;
  },

  min: (minValue) => (value) => {
    if (value === null || value === undefined || value === '') return null;
    return Number(value) >= minValue ? null : `Valor mínimo: ${minValue}`;
  },

  max: (maxValue) => (value) => {
    if (value === null || value === undefined || value === '') return null;
    return Number(value) <= maxValue ? null : `Valor máximo: ${maxValue}`;
  },

  numeric: (value) => {
    if (!value) return null;
    return /^\d+$/.test(value) ? null : 'Solo números permitidos';
  },

  decimal: (value) => {
    if (!value) return null;
    return /^\d+([.,]\d+)?$/.test(value) ? null : 'Número inválido';
  },

  dni: (value) => {
    if (!value) return null;
    const dniRegex = /^[0-9]{8}[A-Za-z]$/;
    const nieRegex = /^[XYZ][0-9]{7}[A-Za-z]$/;
    return (dniRegex.test(value) || nieRegex.test(value)) ? null : 'DNI/NIE inválido';
  },

  url: (value) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'URL inválida';
    }
  },

  date: (value) => {
    if (!value) return null;
    return isNaN(new Date(value).getTime()) ? 'Fecha inválida' : null;
  },

  futureDate: (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date > new Date() ? null : 'La fecha debe ser futura';
  },

  pastDate: (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date < new Date() ? null : 'La fecha debe ser pasada';
  },

  password: (value) => {
    if (!value) return 'La contraseña es requerida';
    if (value.length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(value)) return 'Debe contener al menos una mayúscula';
    if (!/[a-z]/.test(value)) return 'Debe contener al menos una minúscula';
    if (!/[0-9]/.test(value)) return 'Debe contener al menos un número';
    return null;
  },

  confirmPassword: (password) => (value) => {
    if (!value) return 'Confirma la contraseña';
    return value === password ? null : 'Las contraseñas no coinciden';
  }
};

export const composeValidators = (...validators) => (value) => {
  for (const validator of validators) {
    const error = validator(value);
    if (error) return error;
  }
  return null;
};

export const validateForm = (values, validationSchema) => {
  const errors = {};
  for (const [field, validator] of Object.entries(validationSchema)) {
    const error = validator(values[field]);
    if (error) errors[field] = error;
  }
  return errors;
};

// ============================================
// CALCULATIONS
// ============================================

export const calculateTotal = (items, priceKey = 'precio', quantityKey = 'cantidad') => {
  return items.reduce((total, item) => {
    const price = Number(item[priceKey]) || 0;
    const quantity = Number(item[quantityKey]) || 1;
    return total + (price * quantity);
  }, 0);
};

export const calculateSubtotal = (price, quantity = 1) => {
  return (Number(price) || 0) * (Number(quantity) || 1);
};

export const calculateDiscount = (total, discount, isPercentage = true) => {
  if (!discount) return 0;
  return isPercentage ? (total * discount) / 100 : discount;
};

export const calculateTax = (subtotal, taxRate = 21) => {
  return (subtotal * taxRate) / 100;
};

export const calculateFinalPrice = (subtotal, discount = 0, tax = 0) => {
  return subtotal - discount + tax;
};

export const calculatePercentageChange = (current, previous) => {
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const calculateAverage = (values) => {
  if (!values || values.length === 0) return 0;
  const total = values.reduce((acc, val) => acc + (Number(val) || 0), 0);
  return total / values.length;
};

// ============================================
// URL UTILITIES
// ============================================

export const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  const obj = {};
  params.forEach((value, key) => { obj[key] = value; });
  return obj;
};

export const getUrlParam = (key) => new URLSearchParams(window.location.search).get(key);

export const setUrlParams = (params) => {
  const searchParams = new URLSearchParams();
  Object.keys(params).forEach(key => searchParams.set(key, params[key]));
  window.history.replaceState({}, '', `?${searchParams.toString()}`);
};

export const buildQuery = (params) => {
  return Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
};

export const parseQuery = (query) => {
  const params = {};
  query.split('&').forEach(param => {
    const [key, value] = param.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value);
  });
  return params;
};

// ============================================
// STORAGE UTILITIES
// ============================================

export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  }
};

// ============================================
// TYPE CHECKING
// ============================================

export const isString = (value) => typeof value === 'string';
export const isNumber = (value) => typeof value === 'number' && !isNaN(value);
export const isBoolean = (value) => typeof value === 'boolean';
export const isNull = (value) => value === null;
export const isUndefined = (value) => value === undefined;
export const isArray = (value) => Array.isArray(value);
export const isDate = (value) => value instanceof Date;
export const isFunction = (value) => typeof value === 'function';

export const getType = (value) => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

// ============================================
// PERFORMANCE UTILITIES
// ============================================

export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const retry = async (fn, times = 3, delayMs = 1000) => {
  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === times - 1) throw error;
      await delay(delayMs);
    }
  }
};

// ============================================
// COMPARISON UTILITIES
// ============================================

export const isBetween = (value, min, max) => value >= min && value <= max;
export const inRange = (value, start, end) => value > start && value < end;
export const deepEqual = (obj1, obj2) => JSON.stringify(obj1) === JSON.stringify(obj2);

export const shallowEqual = (obj1, obj2) => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  return keys1.every(key => obj1[key] === obj2[key]);
};

// ============================================
// STATUS & LABEL UTILITIES
// ============================================

export const getStatusColor = (status) => {
  return CONSTANTS.STATUS_COLORS[status] || CONSTANTS.STATUS_COLORS.pendiente;
};

export const getStatusLabel = (status) => {
  const labels = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    en_proceso: 'En Proceso',
    completada: 'Completada',
    cancelada: 'Cancelada',
    no_show: 'No Asistió'
  };
  return labels[status] || capitalize(status);
};

export const getPaymentMethodLabel = (method) => {
  const labels = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
    bizum: 'Bizum',
    mixto: 'Mixto'
  };
  return labels[method] || capitalize(method);
};

export const getPaymentMethodIcon = (method) => {
  const icons = {
    efectivo: '💵',
    tarjeta: '💳',
    transferencia: '🏦',
    bizum: '📱',
    mixto: '🔄'
  };
  return icons[method] || '💰';
};

// ============================================
// UTILITY GENERATORS
// ============================================

export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const generateCode = (prefix = '', length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix;
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  CONSTANTS,
  capitalize,
  capitalizeWords,
  slug,
  truncate,
  initials,
  pluralize,
  unique,
  flatten,
  groupBy,
  partition,
  chunk,
  random,
  shuffle,
  compact,
  difference,
  intersection,
  union,
  sum,
  average,
  max,
  min,
  sortBy,
  uniqueBy,
  merge,
  pick,
  omit,
  deepMerge,
  deepClone,
  isEmpty,
  invert,
  mapValues,
  filterValues,
  formatDate,
  formatTime,
  formatDateTime,
  getRelativeTime,
  isToday,
  isTomorrow,
  isYesterday,
  getDayName,
  getMonthName,
  addDays,
  addMonths,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  getWeekNumber,
  isSameDay,
  isBetweenDates,
  dateDifference,
  isLeapYear,
  formatCurrency,
  parseCurrency,
  formatNumber,
  formatPercentage,
  formatPhone,
  cleanPhone,
  validators,
  composeValidators,
  validateForm,
  calculateTotal,
  calculateSubtotal,
  calculateDiscount,
  calculateTax,
  calculateFinalPrice,
  calculatePercentageChange,
  calculateAverage,
  getUrlParams,
  getUrlParam,
  setUrlParams,
  buildQuery,
  parseQuery,
  storage,
  debounce,
  throttle,
  delay,
  retry,
  getStatusColor,
  getStatusLabel,
  getPaymentMethodLabel,
  getPaymentMethodIcon,
  generateId,
  generateCode
};
