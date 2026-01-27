const express = require('express');
const router = express.Router();
const { getApiUsageStats, getGlobalStats, resetTenantCounter } = require('../middleware/planLimits');
const { verificarToken } = require('../middleware/auth');

/**
 * GET /api/usage/my-stats
 * Obtener estadísticas de uso de API calls del tenant actual
 */
router.get('/my-stats', verificarToken, (req, res) => {
  try {
    console.log('DEBUG /my-stats - req.tenantId:', req.tenantId, 'req.tenant:', req.tenant);
    const tenantId = req.tenantId;
    const tenantPlan = req.tenantPlan || 'basic';

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID no encontrado'
      });
    }

    const stats = getApiUsageStats(tenantId, tenantPlan);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting API usage stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de uso',
      error: error.message
    });
  }
});

/**
 * GET /api/usage/global-stats
 * Obtener estadísticas globales de todos los tenants (ADMIN ONLY)
 */
router.get('/global-stats', verificarToken, (req, res) => {
  try {
    // Verificar que es admin
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden acceder a estadísticas globales'
      });
    }

    const stats = getGlobalStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting global stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas globales',
      error: error.message
    });
  }
});

/**
 * POST /api/usage/reset
 * Resetear contador de API calls de un tenant (ADMIN ONLY)
 * Solo para testing
 */
router.post('/reset', verificarToken, (req, res) => {
  try {
    // Verificar que es admin
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden resetear contadores'
      });
    }

    const { tenantId } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'tenantId es requerido'
      });
    }

    resetTenantCounter(tenantId);

    res.json({
      success: true,
      message: `Contador de API calls reseteado para tenant ${tenantId}`
    });
  } catch (error) {
    console.error('Error resetting counter:', error);
    res.status(500).json({
      success: false,
      message: 'Error al resetear contador',
      error: error.message
    });
  }
});

/**
 * GET /api/usage/plan-limits/:planId
 * Obtener límites de un plan específico
 */
router.get('/plan-limits/:planId', (req, res) => {
  try {
    const { planId } = req.params;
    const plansService = require('../services/plansService');
    const plan = plansService.getPlan(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        planId: plan.id,
        planName: plan.name,
        limits: {
          apiCallsMonthly: plan.limitations.api_calls_monthly,
          concurrentUsers: plan.limitations.concurrent_users,
          fileUploadSizeMb: plan.limitations.file_upload_size_mb,
          customFields: plan.limitations.custom_fields
        }
      }
    });
  } catch (error) {
    console.error('Error fetching plan limits:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener límites del plan',
      error: error.message
    });
  }
});

module.exports = router;
