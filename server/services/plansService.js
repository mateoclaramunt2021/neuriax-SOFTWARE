/**
 * Servicio de Planes SaaS
 * Gestiona la lógica de planes, límites y validación de features
 */

const plansConfig = require('../config/plans');

class PlansService {
  /**
   * Obtener todos los planes disponibles
   */
  static getAll() {
    const planes = Object.values(plansConfig.plans).map(plan => ({
      ...plan,
      visible: true,
      activo: true
    }));
    return planes;
  }

  /**
   * Obtener un plan específico por ID
   */
  static getPlan(planId) {
    const plan = plansConfig.plans[planId];
    return plan || null;
  }

  /**
   * Obtener un plan por slug
   */
  static getPlanBySlug(slug) {
    const plans = Object.values(plansConfig.plans);
    return plans.find(p => p.id === slug) || null;
  }

  /**
   * Verificar si un tenant ha alcanzado su límite
   */
  static checkLimit(planId, limitType, currentValue) {
    const plan = this.getPlan(planId);
    if (!plan) return false;

    const limit = plan.limitations[limitType];
    
    // Si es null o muy alto (ilimitado), siempre hay espacio
    if (limit === null || limit >= 999999) return true;
    
    // Si hay límite numérico, comparar
    return currentValue < limit;
  }

  /**
   * Obtener límite específico
   */
  static getLimit(planId, limitType) {
    const plan = this.getPlan(planId);
    if (!plan) return null;
    
    return plan.limitations[limitType];
  }

  /**
   * Obtener el valor de una característica
   */
  static hasFeature(planId, featureName) {
    const plan = this.getPlan(planId);
    if (!plan) return false;
    
    return plan.features[featureName] === true;
  }

  /**
   * Validar upgrade de plan
   */
  static canUpgrade(currentPlanId, newPlanId) {
    const currentPlan = this.getPlan(currentPlanId);
    const newPlan = this.getPlan(newPlanId);
    
    if (!currentPlan || !newPlan) return false;
    
    return newPlan.orden > currentPlan.orden;
  }

  /**
   * Calcular próximo pago
   */
  static getNextBillingDate(currentDate = new Date()) {
    const nextDate = new Date(currentDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    return nextDate.toISOString().split('T')[0];
  }

  /**
   * Obtener resumen de plan para dashboard
   */
  static getSummary(planId) {
    const plan = this.getPlan(planId);
    if (!plan) return null;

    return {
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      precio_mensual: plan.precio_mensual,
      precio_anual: plan.precio_anual,
      moneda: plan.moneda,
      caracteristicas: plan.caracteristicas,
      limites: plan.limites
    };
  }

  /**
   * Obtener todos los límites de un plan (para mostrar en dashboard)
   */
  static getAllLimits(planId) {
    const plan = this.getPlan(planId);
    if (!plan) return null;

    return {
      planId: plan.id,
      planNombre: plan.nombre,
      limits: {
        clientes: plan.limitations?.clientes || 999999,
        servicios: plan.limitations?.servicios || 999999,
        empleados: plan.limitations?.empleados || 999999,
        usuarios: plan.limitations?.usuarios || 1,
        reportesAvanzados: plan.features?.reportesAvanzados || false,
        smsReminders: plan.features?.smsReminders || false,
        equipoMultiple: plan.features?.equipoMultiple || false,
        integracionStripe: plan.features?.integracionStripe || false,
        apiAccess: plan.features?.apiAccess || false
      }
    };
  }

  /**
   * Validar si puede realizar acción según límite (para middleware)
   */
  static validateLimitAction(planId, actionType, currentCount) {
    const plan = this.getPlan(planId);
    if (!plan) return { allowed: false, message: 'Plan no encontrado' };

    const limits = plan.limitations || {};
    const limit = limits[actionType];

    // Si no hay límite (null) o es muy alto, permitir
    if (!limit || limit === null) {
      return { allowed: true };
    }

    // Si ya alcanzó el límite
    if (currentCount >= limit) {
      return {
        allowed: false,
        message: `Ha alcanzado el límite de ${limit} ${actionType} en su plan ${plan.nombre}`,
        limit: limit,
        current: currentCount,
        actionType: actionType,
        planId: planId
      };
    }

    // Aún tiene espacio
    return {
      allowed: true,
      remaining: limit - currentCount,
      limit: limit,
      current: currentCount
    };
  }
}

module.exports = PlansService;
