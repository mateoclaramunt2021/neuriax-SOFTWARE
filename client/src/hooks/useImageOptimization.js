/**
 * Image Optimization Hook
 * Optimiza imágenes para mejor performance
 */

import { useEffect, useState } from 'react';

/**
 * Hook para optimizar imágenes con lazy loading
 * @param {string} src - URL de la imagen
 * @param {string} placeholder - Imagen placeholder
 * @returns {Object} { isLoaded, imageSrc }
 */
export const useImageOptimization = (src, placeholder = null) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(placeholder || src);

  useEffect(() => {
    let mounted = true;
    const img = new Image();

    img.onload = () => {
      if (mounted) {
        setImageSrc(src);
        setIsLoaded(true);
      }
    };

    img.onerror = () => {
      if (mounted) {
        console.warn(`Failed to load image: ${src}`);
        setIsLoaded(true);
      }
    };

    img.src = src;

    return () => {
      mounted = false;
    };
  }, [src]);

  return { isLoaded, imageSrc };
};

/**
 * Hook para IntersectionObserver (lazy loading)
 * @param {React.RefObject} ref - Referencia al elemento
 * @param {Object} options - Opciones de IntersectionObserver
 * @returns {boolean} isVisible
 */
export const useIntersectionObserver = (ref, options = {}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, {
      threshold: 0.1,
      ...options,
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, options]);

  return isVisible;
};

/**
 * Convierte imagen a WebP si es soportado
 * @param {string} imagePath - Path de la imagen
 * @returns {string} URL de la imagen optimizada
 */
export const getOptimizedImageUrl = (imagePath) => {
  if (!imagePath) return '';

  const supportsWebP = document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
  
  if (supportsWebP && imagePath.match(/\.(jpg|jpeg|png)$/i)) {
    return imagePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }

  return imagePath;
};

/**
 * Hook para cargar imagen con placeholder
 * @param {string} src - URL de imagen principal
 * @param {string} placeholderSrc - URL de placeholder
 * @returns {Object} { src, isLoading }
 */
export const useImageWithPlaceholder = (src, placeholderSrc) => {
  const [imageSrc, setImageSrc] = useState(placeholderSrc);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      console.error(`Error loading image: ${src}`);
      setIsLoading(false);
    };

    img.src = src;
  }, [src]);

  return { src: imageSrc, isLoading };
};

export default {
  useImageOptimization,
  useIntersectionObserver,
  getOptimizedImageUrl,
  useImageWithPlaceholder,
};
