/**
 * Performance Monitoring - Web Vitals & Analytics
 * NEURIAX Platform v2.5
 */

import { onCLS, onFCP, onLCP, onTTFB } from 'web-vitals';

const THRESHOLD = {
  CLS: 0.1,    // Cumulative Layout Shift
  FCP: 1800,   // First Contentful Paint
  LCP: 2500,   // Largest Contentful Paint
  TTFB: 600,   // Time to First Byte
};

/**
 * Reporta Web Vitals
 */
export const reportWebVitals = (onPerfEntry) => {
  if (process.env.NODE_ENV === 'production') {
    onCLS(onPerfEntry);
    onFCP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  }
};

/**
 * Monitorea Performance API
 */
export const monitorPerformance = () => {
  if (!window.performance || !window.performance.timing) return;

  const perf = window.performance.timing;
  const metrics = {
    pageLoadTime: perf.loadEventEnd - perf.navigationStart,
    domInteractive: perf.domInteractive - perf.navigationStart,
    domComplete: perf.domComplete - perf.navigationStart,
    resourcesTime: perf.responseEnd - perf.fetchStart,
    timeToFirstByte: perf.responseStart - perf.navigationStart,
  };

  console.log('📊 Performance Metrics:', metrics);
  return metrics;
};

/**
 * Mide tiempo de carga de componentes
 */
export const measureComponentPerformance = (componentName, callback) => {
  const startTime = performance.now();

  const result = callback();

  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(`⏱️ ${componentName} took ${duration.toFixed(2)}ms`);

  return result;
};

/**
 * Valida Web Vitals contra thresholds
 */
export const validateWebVitals = (vitals) => {
  const warnings = [];

  if (vitals.CLS > THRESHOLD.CLS) {
    warnings.push(`⚠️ CLS: ${vitals.CLS.toFixed(3)} (threshold: ${THRESHOLD.CLS})`);
  }
  if (vitals.FCP > THRESHOLD.FCP) {
    warnings.push(`⚠️ FCP: ${vitals.FCP.toFixed(0)}ms (threshold: ${THRESHOLD.FCP}ms)`);
  }
  if (vitals.LCP > THRESHOLD.LCP) {
    warnings.push(`⚠️ LCP: ${vitals.LCP.toFixed(0)}ms (threshold: ${THRESHOLD.LCP}ms)`);
  }
  if (vitals.TTFB > THRESHOLD.TTFB) {
    warnings.push(`⚠️ TTFB: ${vitals.TTFB.toFixed(0)}ms (threshold: ${THRESHOLD.TTFB}ms)`);
  }

  if (warnings.length > 0) {
    console.warn('Performance warnings:', warnings);
  }

  return warnings;
};

export default {
  reportWebVitals,
  monitorPerformance,
  measureComponentPerformance,
  validateWebVitals,
};
