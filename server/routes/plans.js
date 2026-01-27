const express = require('express');
const router = express.Router();
const plansService = require('../services/plansService');
const { verificarToken } = require('../middleware/auth');

/**
 * GET /api/plans
 * Obtener todos los planes disponibles
 */
router.get('/', async (req, res) => {
  try {
    const plans = plansService.getAll();
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener planes',
      error: error.message
    });
  }
});

/**
 * GET /api/plans/:planId
 * Obtener un plan específico por ID
 */
router.get('/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = plansService.getPlan(planId);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener plan',
      error: error.message
    });
  }
});

/**
 * GET /api/plans/:planId/features
 * Obtener features de un plan específico
 */
router.get('/:planId/features', async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = plansService.getPlan(planId);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }
    
    res.json({
      success: true,
      planId: planId,
      features: plan.features,
      limitations: plan.limitations
    });
  } catch (error) {
    console.error('Error fetching plan features:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener features del plan',
      error: error.message
    });
  }
});

/**
 * GET /api/plans/comparison/table
 * Obtener tabla de comparación de planes
 */
router.get('/comparison/table', async (req, res) => {
  try {
    const plans = plansService.getAll();
    const comparisonData = {};
    
    plans.forEach(plan => {
      comparisonData[plan.id] = {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        price_display: plan.price === -1 ? 'A consultar' : `${plan.price}€/mes`,
        features: plan.features,
        limitations: plan.limitations
      };
    });
    
    res.json({
      success: true,
      data: comparisonData
    });
  } catch (error) {
    console.error('Error fetching comparison table:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tabla comparativa',
      error: error.message
    });
  }
});

/**
 * POST /api/plans/upgrade
 * Upgrade del plan de un tenant (requiere autenticación)
 */
router.post('/upgrade', verificarToken, async (req, res) => {
  try {
    const { currentPlan, newPlan } = req.body;
    
    if (!currentPlan || !newPlan) {
      return res.status(400).json({
        success: false,
        message: 'Plan actual y nuevo plan son requeridos'
      });
    }
    
    const canUpgrade = plansService.canUpgrade(currentPlan, newPlan);
    
    if (!canUpgrade) {
      return res.status(400).json({
        success: false,
        message: 'No se puede hacer downgrade de planes. Solo se permite upgrading.',
        current: currentPlan,
        new: newPlan
      });
    }
    
    const newPlanData = plansService.getPlan(newPlan);
    const nextBillingDate = plansService.getNextBillingDate();
    
    res.json({
      success: true,
      message: 'Upgrade aprobado',
      data: {
        previousPlan: currentPlan,
        newPlan: newPlan,
        planDetails: newPlanData,
        nextBillingDate: nextBillingDate,
        message: 'El cambio de plan entra en vigor inmediatamente. La próxima facturación será el ' + nextBillingDate
      }
    });
  } catch (error) {
    console.error('Error upgrading plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al hacer upgrade del plan',
      error: error.message
    });
  }
});

/**
 * POST /api/plans/check-feature/:feature
 * Verificar si un tenant tiene acceso a una feature (requiere autenticación)
 */
router.post('/check-feature/:feature', verificarToken, async (req, res) => {
  try {
    const { feature } = req.params;
    const { plan } = req.body;
    
    if (!plan || !feature) {
      return res.status(400).json({
        success: false,
        message: 'Plan y feature son requeridos'
      });
    }
    
    const hasFeature = plansService.hasFeature(plan, feature);
    const planData = plansService.getPlan(plan);
    
    res.json({
      success: true,
      plan: plan,
      feature: feature,
      hasAccess: hasFeature,
      planName: planData?.name || 'Desconocido'
    });
  } catch (error) {
    console.error('Error checking feature:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar feature',
      error: error.message
    });
  }
});

/**
 * POST /api/plans/check-limit/:limitType
 * Verificar si un tenant está dentro del límite
 */
router.post('/check-limit/:limitType', verificarToken, async (req, res) => {
  try {
    const { limitType } = req.params;
    const { plan, currentValue } = req.body;
    
    if (!plan || limitType === undefined || currentValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Plan, limitType y currentValue son requeridos'
      });
    }
    
    const isWithinLimit = plansService.checkLimit(plan, limitType, currentValue);
    const limit = plansService.getLimit(plan, limitType);
    const planData = plansService.getPlan(plan);
    
    res.json({
      success: true,
      plan: plan,
      limitType: limitType,
      currentValue: currentValue,
      limit: limit,
      withinLimit: isWithinLimit,
      remaining: limit !== null ? limit - currentValue : null,
      planName: planData?.name || 'Desconocido'
    });
  } catch (error) {
    console.error('Error checking limit:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar límite',
      error: error.message
    });
  }
});

/**
 * GET /api/plans/limits
 * Obtener información de límites del plan actual del usuario
 */
router.get('/limits', verificarToken, async (req, res) => {
  try {
    const { getDatabase, loadDatabase } = require('../database/init');
    const authService = require('../services/authService');

    loadDatabase();
    const db = getDatabase();

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token requerido'
      });
    }

    const verification = authService.verifyAccessToken(token);
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    const usuarioId = verification.decoded.id;
    const usuario = db.usuarios.find(u => u.id === usuarioId);

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Si es cliente, retornar sin límites
    if (usuario.tipo_usuario === 'cliente') {
      return res.json({
        success: true,
        data: {
          planId: 'cliente',
          planNombre: 'Cliente',
          limits: {},
          usage: {},
          tenant: null
        }
      });
    }

    // Obtener plan de la empresa
    const tenant = db.tenants?.find(t => t.id === usuario.tenant_id);
    if (!tenant) {
      return res.status(400).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    const planId = tenant.plan || 'trial';
    const limitsInfo = plansService.getAllLimits(planId);

    // Obtener conteos actuales
    const usage = {
      clientes: (db.clientes || []).filter(c => c.tenant_id === usuario.tenant_id).length,
      servicios: (db.servicios || []).filter(s => s.tenant_id === usuario.tenant_id).length,
      empleados: (db.empleados || []).filter(e => e.tenant_id === usuario.tenant_id).length,
      usuarios: (db.usuarios || []).filter(u => u.tenant_id === usuario.tenant_id).length
    };

    // Calcular días restantes del trial
    let diasRestantes = null;
    if (tenant.dias_trial && tenant.fecha_inicio_trial) {
      const fechaInicio = new Date(tenant.fecha_inicio_trial);
      const ahora = new Date();
      const diasTranscurridos = Math.floor((ahora - fechaInicio) / (1000 * 60 * 60 * 24));
      diasRestantes = Math.max(0, tenant.dias_trial - diasTranscurridos);
    }

    res.json({
      success: true,
      data: {
        planId: limitsInfo.planId,
        planNombre: limitsInfo.planNombre,
        limits: limitsInfo.limits,
        usage: usage,
        tenant: {
          id: tenant.id,
          nombre: tenant.nombre,
          estado: tenant.estado,
          diasTrial: tenant.dias_trial,
          fechaInicio: tenant.fecha_inicio_trial,
          diasRestantes: diasRestantes
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo límites:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener límites',
      error: error.message
    });
  }
});

module.exports = router;
