/**
 * PASO 6 - Middleware de Tenant para NEURIAX Multi-Tenant
 * Versión SIMPLIFICADA - sin validaciones que rompan el servidor
 */

let db;

function setDatabase(database) {
  db = database;
}

function getTenantFromRequest(req, res, next) {
  try {
    let tenantId = req.headers['x-tenant-id'] || 'demo';
    req.tenantId = tenantId;
    req.tenant = { id: tenantId };
    next();
  } catch (error) {
    req.tenantId = 'demo';
    req.tenant = { id: 'demo' };
    next();
  }
}

/**
 * PASO 15 - Middleware para asignar plan del tenant
 */
function assignTenantPlan(req, res, next) {
  try {
    const tenantId = req.tenantId || 'demo';
    
    // Por defecto, asignar plan 'basic'
    req.tenantPlan = 'basic';

    // Si es tenant demo, asignar plan 'pro' (para demostración)
    if (tenantId === 'demo') {
      req.tenantPlan = 'pro';
    }

    next();
  } catch (error) {
    req.tenantPlan = 'basic';
    next();
  }
}

function filterByTenant(data, tenantId) {
  if (Array.isArray(data)) {
    return data.filter(item => item.tenant_id === tenantId);
  }
  return data;
}

module.exports = {
  getTenantFromRequest,
  assignTenantPlan,
  filterByTenant,
  setDatabase
};
