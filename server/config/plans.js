/**
 * PASO 14: Monetización - Definir Planes SaaS
 * 
 * Estructura de planes para NEURIAX Salon Manager
 * Define qué características están disponibles en cada plan
 */

module.exports = {
  plans: {
    // Plan Trial - 7 días gratis con todas las funciones
    trial: {
      id: 'trial',
      name: 'Prueba Gratuita',
      description: '7 días para probar todas las funciones',
      price: 0,
      currency: 'EUR',
      period: 'trial',
      trialDays: 7,
      icon: '🎁',
      
      features: {
        // Mismas funciones que Pro para que vean el valor
        max_employees: 3,
        max_clients: 50,
        max_appointments_monthly: 100,
        appointment_reminders: true,
        sms_notifications: false,
        max_services: 20,
        custom_service_images: true,
        inventory_management: true,
        basic_reports: true,
        advanced_reports: true,
        custom_reports: false,
        export_pdf: true,
        export_excel: false,
        stripe_payment: false,
        paypal_payment: false,
        webhook_integrations: false,
        api_access: false,
        email_support: true,
        priority_support: false,
        phone_support: false,
        storage_gb: 1,
        powered_by_neuriax: true,
        custom_domain: false,
        custom_branding: false,
        basic_encryption: true,
        advanced_encryption: false,
        sso_enabled: false,
      },
      
      limitations: {
        api_calls_monthly: 10000,
        concurrent_users: 2,
        file_upload_size_mb: 5,
        custom_fields: false,
      },
      
      benefits: [
        '7 días gratis sin compromiso',
        'Hasta 50 clientes',
        'Hasta 3 empleados',
        'Gestión de citas completa',
        'Inventario básico',
        'Reportes avanzados',
        'Sin tarjeta de crédito'
      ]
    },

    basic: {
      id: 'basic',
      name: 'Plan Básico',
      description: 'Para emprendedores',
      price: 39,
      currency: 'EUR',
      period: 'monthly',
      icon: '🎯',
      
      features: {
        // Empleados
        max_employees: 1,
        
        // Clientes
        max_clients: 10,
        
        // Citas
        max_appointments_monthly: 100,
        appointment_reminders: false,
        sms_notifications: false,
        
        // Servicios
        max_services: 5,
        custom_service_images: false,
        
        // Inventario
        inventory_management: false,
        
        // Reportes
        basic_reports: true,
        advanced_reports: false,
        custom_reports: false,
        export_pdf: false,
        export_excel: false,
        
        // Integraciones
        stripe_payment: true,
        paypal_payment: false,
        webhook_integrations: false,
        api_access: false,
        
        // Soporte
        email_support: true,
        priority_support: false,
        phone_support: false,
        
        // Almacenamiento
        storage_gb: 1,
        
        // Branding
        powered_by_neuriax: true,
        custom_domain: false,
        custom_branding: false,
        
        // Seguridad
        basic_encryption: true,
        advanced_encryption: false,
        sso_enabled: false,
      },
      
      limitations: {
        api_calls_monthly: 1000,
        concurrent_users: 1,
        file_upload_size_mb: 5,
        custom_fields: false,
      },
      
      benefits: [
        'Gestión completa de citas',
        'Hasta 100 clientes',
        'Hasta 2 empleados',
        'Reportes básicos',
        'Soporte por email',
        'Punto de venta',
        '5 GB almacenamiento'
      ]
    },

    pro: {
      id: 'pro',
      name: 'Plan Profesional',
      description: 'Para negocios en crecimiento',
      price: 79,
      currency: 'EUR',
      period: 'monthly',
      icon: '⭐',
      
      features: {
        // Empleados
        max_employees: 5,
        
        // Clientes
        max_clients: 500,
        
        // Citas
        max_appointments_monthly: 5000,
        appointment_reminders: true,
        sms_notifications: true,
        
        // Servicios
        max_services: 50,
        custom_service_images: true,
        
        // Inventario
        inventory_management: true,
        
        // Reportes
        basic_reports: true,
        advanced_reports: true,
        custom_reports: false,
        export_pdf: true,
        export_excel: true,
        
        // Integraciones
        stripe_payment: true,
        paypal_payment: true,
        webhook_integrations: true,
        api_access: true,
        
        // Soporte
        email_support: true,
        priority_support: true,
        phone_support: false,
        
        // Almacenamiento
        storage_gb: 10,
        
        // Branding
        powered_by_neuriax: true,
        custom_domain: true,
        custom_branding: false,
        
        // Seguridad
        basic_encryption: true,
        advanced_encryption: true,
        sso_enabled: false,
      },
      
      limitations: {
        api_calls_monthly: 50000,
        concurrent_users: 5,
        file_upload_size_mb: 50,
        custom_fields: 10,
      },
      
      benefits: [
        'Todo del plan Básico +',
        'Hasta 10 empleados',
        'Clientes ilimitados',
        'Inventario completo',
        'Reportes avanzados',
        'Exportación PDF/Excel',
        'Notificaciones SMS',
        'Soporte prioritario',
        '50 GB almacenamiento'
      ]
    },

    enterprise: {
      id: 'enterprise',
      name: 'Plan Enterprise',
      description: 'Para grandes empresas',
      price: -1,
      currency: 'EUR',
      period: 'custom',
      icon: '👑',
      
      features: {
        // Empleados
        max_employees: null, // Ilimitado
        
        // Clientes
        max_clients: null, // Ilimitado
        
        // Citas
        max_appointments_monthly: null, // Ilimitado
        appointment_reminders: true,
        sms_notifications: true,
        
        // Servicios
        max_services: null, // Ilimitado
        custom_service_images: true,
        
        // Inventario
        inventory_management: true,
        
        // Reportes
        basic_reports: true,
        advanced_reports: true,
        custom_reports: true,
        export_pdf: true,
        export_excel: true,
        
        // Integraciones
        stripe_payment: true,
        paypal_payment: true,
        webhook_integrations: true,
        api_access: true,
        
        // Soporte
        email_support: true,
        priority_support: true,
        phone_support: true,
        
        // Almacenamiento
        storage_gb: null, // Ilimitado
        
        // Branding
        powered_by_neuriax: false,
        custom_domain: true,
        custom_branding: true,
        
        // Seguridad
        basic_encryption: true,
        advanced_encryption: true,
        sso_enabled: true,
      },
      
      limitations: {
        api_calls_monthly: null, // Ilimitado
        concurrent_users: null, // Ilimitado
        file_upload_size_mb: 500,
        custom_fields: null, // Ilimitado
      },
      
      benefits: [
        'TODO ILIMITADO',
        'Empleados ilimitados',
        'Clientes ilimitados',
        'Citas ilimitadas',
        'Servicios ilimitados',
        'Almacenamiento ilimitado',
        'API completo sin límites',
        'Reportes personalizados',
        'Soporte 24/7 por teléfono',
        'Implementación personalizada',
        'Integración SSO',
        'Branding personalizado',
        'Gestor de cuentas dedicado',
        'Garantía de 99.99% uptime',
      ]
    }
  }
};
