/**
 * WELCOME GUIDE - Guía de Bienvenida Mejorada
 * Pasos recomendados para nuevos usuarios
 */

export const welcomeChecklist = [
  {
    id: 1,
    title: '✂️ Agrega tus Servicios',
    description: 'Define qué servicios ofreces (cortes, tintes, etc) con precios y duración',
    time: '5 min',
    icon: '✂️',
    action: 'servicios',
    completed: false,
    importance: 'CRÍTICO',
    tip: 'Los servicios que agregues aparecerán en tu Marketplace online'
  },
  {
    id: 2,
    title: '👤 Crea tus Empleados',
    description: 'Registra a tu equipo y sus horarios de trabajo',
    time: '10 min',
    icon: '👤',
    action: 'empleados',
    completed: false,
    importance: 'CRÍTICO',
    tip: 'Los clientes podrán elegir qué empleado quieren'
  },
  {
    id: 3,
    title: '🏪 Completa tu Marketplace',
    description: 'Sube fotos, horarios y descripción de tu salón',
    time: '5 min',
    icon: '🏪',
    action: 'marketplace',
    completed: false,
    importance: 'CRÍTICO',
    tip: 'Los clientes buscan salones en Google, ¡asegúrate de estar visible!'
  },
  {
    id: 4,
    title: '💳 Haz tu Primera Venta (POS)',
    description: 'Registra una venta de prueba para familiarizarte con el sistema',
    time: '2 min',
    icon: '💳',
    action: 'ventas',
    completed: false,
    importance: 'IMPORTANTE',
    tip: 'Aquí es donde cobras. Súper rápido y simple'
  },
  {
    id: 5,
    title: '💰 Abre tu Caja',
    description: 'Realiza el arqueo inicial y configura tu caja',
    time: '3 min',
    icon: '💰',
    action: 'caja',
    completed: false,
    importance: 'IMPORTANTE',
    tip: 'Abre caja cada mañana, cierra cada noche. Auditoría automática'
  },
  {
    id: 6,
    title: '📅 Acepta tu Primer Cliente Online',
    description: 'Los clientes pueden reservar desde el Marketplace',
    time: '0 min',
    icon: '📅',
    action: 'reservas',
    completed: false,
    importance: 'AUTOMÁTICO',
    tip: 'Recibirán recordatorios 24h, 5h y 1h antes de la cita'
  },
  {
    id: 7,
    title: '📈 Explora tus Reportes',
    description: 'Ve gráficos, ingresos, clientes favoritos y estadísticas',
    time: '5 min',
    icon: '📈',
    action: 'reportes',
    completed: false,
    importance: 'OPCIONAL',
    tip: 'Toma decisiones basadas en datos reales de tu negocio'
  }
];

/**
 * Secuencia de video-tutoriales cortos
 */
export const videoTutorials = [
  {
    id: 1,
    title: '¿Cómo agregar servicios?',
    duration: '1:30',
    url: 'https://youtube.com/watch?v=xxx',
    thumbnail: '✂️'
  },
  {
    id: 2,
    title: '¿Cómo funciona el POS?',
    duration: '2:45',
    url: 'https://youtube.com/watch?v=xxx',
    thumbnail: '💳'
  },
  {
    id: 3,
    title: '¿Cómo vender online?',
    duration: '2:15',
    url: 'https://youtube.com/watch?v=xxx',
    thumbnail: '🏪'
  },
  {
    id: 4,
    title: '¿Cómo gerenciar empleados?',
    duration: '2:00',
    url: 'https://youtube.com/watch?v=xxx',
    thumbnail: '👤'
  }
];

/**
 * Beneficios principales a resaltar
 */
export const mainBenefits = [
  {
    icon: '🏪',
    title: 'Marketplace Online',
    description: 'Aparece en Google automáticamente. Clientes te encuentran y reservan 24/7'
  },
  {
    icon: '🔔',
    title: 'Recordatorios Automáticos',
    description: 'Clientes reciben SMS/Email 24h, 5h y 1h antes. Reduce no-shows 90%'
  },
  {
    icon: '💳',
    title: 'POS Súper Rápido',
    description: 'Cobra en segundos. Tickets automáticos. Sin papeleos'
  },
  {
    icon: '📊',
    title: 'Reportes en Tiempo Real',
    description: 'Ve tus números: ingresos, clientes, servicios top. Datos para crecer'
  },
  {
    icon: '📱',
    title: 'Dashboard Profesional',
    description: 'Interface intuitiva. Todo lo que necesitas en un click'
  },
  {
    icon: '🔒',
    title: 'Seguridad Garantizada',
    description: 'Encriptación SSL, respaldos diarios, servidores en nube'
  }
];

/**
 * Funciones bloqueadas según plan
 */
export const planFeatures = {
  BASIC: {
    name: 'BASIC - 39€/mes',
    features: [
      '✅ Hasta 50 clientes',
      '✅ Hasta 10 servicios',
      '✅ 2 empleados',
      '✅ Marketplace online',
      '✅ POS & Caja',
      '✅ Recordatorios 24h, 5h, 1h',
      '❌ Inventario (limitado)',
      '❌ Reportes avanzados'
    ]
  },
  PRO: {
    name: 'PRO - 79€/mes',
    features: [
      '✅ Hasta 500 clientes',
      '✅ Hasta 50 servicios',
      '✅ 10 empleados',
      '✅ Marketplace online',
      '✅ POS & Caja',
      '✅ Recordatorios 24h, 5h, 1h',
      '✅ Inventario completo',
      '✅ Reportes detallados',
      '✅ Integraciones'
    ]
  },
  ENTERPRISE: {
    name: 'ENTERPRISE - Personalizado',
    features: [
      '✅ Clientes ilimitados',
      '✅ Servicios ilimitados',
      '✅ Empleados ilimitados',
      '✅ TODO lo anterior',
      '✅ API personalizada',
      '✅ Soporte prioritario',
      '✅ Integraciones custom'
    ]
  }
};

/**
 * Tips de productividad
 */
export const productivityTips = [
  {
    title: 'Atajos de Teclado',
    tips: [
      'Ctrl + N: Nueva venta rápida',
      'Ctrl + S: Guardar',
      'Ctrl + F: Buscar cliente'
    ]
  },
  {
    title: 'Gestión de Tiempo',
    tips: [
      'Abre caja a primera hora',
      'Revisa Marketplace cada mañana',
      'Cierra caja al final del día',
      'Revisa reportes cada semana'
    ]
  },
  {
    title: 'Marketing Local',
    tips: [
      'Comparte tu Marketplace en redes',
      'Pide a clientes que dejen reseñas',
      'Ofrece descuentos por referrals',
      'Usa reportes para identificar trends'
    ]
  }
];
