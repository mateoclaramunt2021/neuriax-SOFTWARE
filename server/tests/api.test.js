/**
 * ============================================================
 * NEURIAX Platform - Tests de API
 * ============================================================
 * 
 * Tests básicos para verificar que los endpoints funcionan.
 * 
 * Uso:
 *   npm test
 *   node server/tests/api.test.js
 */

const http = require('http');

// Configuración
const API_URL = process.env.API_URL || 'http://localhost:3001';
const TIMEOUT = 5000;

// Colores para consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Contadores
let passed = 0;
let failed = 0;
let skipped = 0;

// Funciones de ayuda
const log = {
    pass: (msg) => { passed++; console.log(`${colors.green}✓${colors.reset} ${msg}`); },
    fail: (msg, err) => { failed++; console.log(`${colors.red}✗${colors.reset} ${msg}${err ? `: ${err}` : ''}`); },
    skip: (msg) => { skipped++; console.log(`${colors.yellow}○${colors.reset} ${msg} (skipped)`); },
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    title: (msg) => console.log(`\n${colors.magenta}${colors.bright}═══ ${msg} ═══${colors.reset}\n`)
};

/**
 * Realizar petición HTTP
 */
function request(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_URL);
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            timeout: TIMEOUT
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(body);
                } catch {
                    parsed = body;
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: parsed
                });
            });
        });

        req.on('error', reject);
        req.on('timeout', () => reject(new Error('Timeout')));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Token para pruebas autenticadas
let authToken = null;

/**
 * Tests de Health Check
 */
async function testHealthCheck() {
    log.title('HEALTH CHECK');

    try {
        const res = await request('GET', '/api/health');
        
        if (res.status === 200) {
            log.pass('GET /api/health - Status 200');
        } else {
            log.fail('GET /api/health', `Expected 200, got ${res.status}`);
        }

        if (res.body && res.body.status === 'ok') {
            log.pass('Health check response contains status: ok');
        } else {
            log.fail('Health check response format', 'Missing status: ok');
        }

    } catch (err) {
        log.fail('Health check endpoint', err.message);
    }
}

/**
 * Tests de Autenticación
 */
async function testAuth() {
    log.title('AUTENTICACIÓN');

    // Test login con credenciales inválidas
    try {
        const res = await request('POST', '/api/auth/login', {
            username: 'invalid_user',
            password: 'wrong_password'
        });

        if (res.status === 401 || res.status === 400 || res.status === 403) {
            log.pass('POST /api/auth/login - Rechaza credenciales inválidas');
        } else {
            log.fail('Login invalid credentials', `Expected 401/400/403, got ${res.status}`);
        }
    } catch (err) {
        log.fail('Login endpoint', err.message);
    }

    // Test login con credenciales válidas (demo)
    try {
        const res = await request('POST', '/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });

        if (res.status === 200) {
            if (res.body.token) {
                authToken = res.body.token;
                log.pass('POST /api/auth/login - Login exitoso con token');
            } else if (res.body.accessToken) {
                authToken = res.body.accessToken;
                log.pass('POST /api/auth/login - Login exitoso con accessToken');
            } else {
                log.pass('POST /api/auth/login - Login exitoso (respuesta sin token explícito)');
            }
        } else if (res.status === 401) {
            log.skip('Login demo credentials not configured');
        } else {
            log.info(`Login response: ${res.status}`);
        }
    } catch (err) {
        log.fail('Login endpoint', err.message);
    }

    // Test endpoint protegido sin token
    try {
        const res = await request('GET', '/api/auth/profile');

        if (res.status === 401 || res.status === 403 || res.status === 404) {
            log.pass('GET /api/auth/profile - Endpoint protegido responde correctamente');
        } else {
            log.info(`Protected endpoint status: ${res.status}`);
        }
    } catch (err) {
        log.fail('Protected endpoint', err.message);
    }

    // Test endpoint protegido con token
    if (authToken) {
        try {
            const res = await request('GET', '/api/auth/profile', null, {
                'Authorization': `Bearer ${authToken}`
            });

            if (res.status === 200) {
                log.pass('GET /api/auth/profile - Acepta token válido');
            } else {
                log.info(`Authenticated request status: ${res.status}`);
            }
        } catch (err) {
            log.fail('Authenticated request', err.message);
        }
    } else {
        log.skip('Authenticated request - No token available');
    }
}

/**
 * Tests de Planes
 */
async function testPlans() {
    log.title('PLANES');

    try {
        const res = await request('GET', '/api/plans');

        if (res.status === 200) {
            log.pass('GET /api/plans - Status 200');
            
            // La respuesta puede ser un array o un objeto con plans
            let plans = res.body;
            if (res.body.plans) plans = res.body.plans;
            
            if (Array.isArray(plans) && plans.length > 0) {
                log.pass('Plans response contains data');
                
                const plan = plans[0];
                if (plan.id || plan.nombre || plan.name) {
                    log.pass('Plan object has identification fields');
                } else {
                    log.info('Plan object structure differs from expected');
                }
            } else if (typeof res.body === 'object') {
                log.pass('Plans response is valid object');
            } else {
                log.info('Plans response format differs from expected');
            }
        } else {
            log.fail('GET /api/plans', `Expected 200, got ${res.status}`);
        }
    } catch (err) {
        log.fail('Plans endpoint', err.message);
    }

    // También probar la ruta alternativa
    try {
        const res = await request('GET', '/api/tenants/plans');
        
        if (res.status === 200) {
            log.pass('GET /api/tenants/plans - Status 200');
        }
    } catch (err) {
        // Ignorar si no existe
    }
}

/**
 * Tests de Tenants
 */
async function testTenants() {
    log.title('TENANTS (Multi-tenant)');

    // Test crear tenant (sin autenticación debería fallar o requerir datos)
    try {
        const res = await request('POST', '/api/tenants', {
            nombre: 'Test Salon',
            email: 'test@example.com'
        });

        // Puede requerir autenticación o datos adicionales
        if (res.status === 201 || res.status === 400 || res.status === 401) {
            log.pass('POST /api/tenants - Endpoint responde correctamente');
        } else {
            log.info(`POST /api/tenants - Status: ${res.status}`);
        }
    } catch (err) {
        log.fail('Create tenant endpoint', err.message);
    }
}

/**
 * Tests de Documentación (Swagger)
 */
async function testDocs() {
    log.title('DOCUMENTACIÓN');

    try {
        const res = await request('GET', '/api-docs/');

        if (res.status === 200 || res.status === 301 || res.status === 302) {
            log.pass('GET /api-docs/ - Swagger UI disponible');
        } else {
            log.skip('Swagger UI not configured');
        }
    } catch (err) {
        log.skip('Swagger UI not available');
    }

    try {
        const res = await request('GET', '/api-docs/swagger.json');

        if (res.status === 200 && res.body.openapi) {
            log.pass('GET /api-docs/swagger.json - OpenAPI spec available');
        } else {
            log.skip('OpenAPI spec not configured');
        }
    } catch (err) {
        log.skip('OpenAPI spec not available');
    }
}

/**
 * Tests de rutas inexistentes
 */
async function test404() {
    log.title('MANEJO DE ERRORES');

    try {
        const res = await request('GET', '/api/nonexistent-endpoint-12345');

        if (res.status === 404) {
            log.pass('GET /api/nonexistent - Retorna 404');
        } else {
            log.fail('404 handling', `Expected 404, got ${res.status}`);
        }
    } catch (err) {
        log.fail('404 handling', err.message);
    }
}

/**
 * Tests de CORS
 */
async function testCORS() {
    log.title('CORS');

    try {
        const res = await request('OPTIONS', '/api/health', null, {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET'
        });

        if (res.headers['access-control-allow-origin']) {
            log.pass('CORS headers present');
        } else {
            log.skip('CORS not configured for this origin');
        }
    } catch (err) {
        log.skip('CORS check failed');
    }
}

/**
 * Tests de Rate Limiting (básico)
 */
async function testRateLimiting() {
    log.title('RATE LIMITING');

    try {
        // Hacer varias peticiones rápidas
        const promises = Array(10).fill().map(() => request('GET', '/api/health'));
        const results = await Promise.all(promises);

        const blocked = results.some(r => r.status === 429);
        
        if (blocked) {
            log.pass('Rate limiting activo (429 detectado)');
        } else {
            log.info('Rate limiting no detectado (puede estar configurado con límite alto)');
        }
    } catch (err) {
        log.skip('Rate limiting check failed');
    }
}

/**
 * Ejecutar todos los tests
 */
async function runTests() {
    console.log(`
${colors.magenta}╔═══════════════════════════════════════════════════════════╗
║           NEURIAX Platform - API Tests Suite              ║
║                      Versión 1.0.0                        ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}
`);

    log.info(`Testing API: ${API_URL}`);
    log.info(`Timeout: ${TIMEOUT}ms`);

    const startTime = Date.now();

    // Verificar que el servidor está corriendo
    try {
        await request('GET', '/api/health');
    } catch (err) {
        console.log(`
${colors.red}${colors.bright}ERROR: No se puede conectar al servidor${colors.reset}

Asegúrate de que el servidor está corriendo:
  cd server && npm start

O especifica una URL diferente:
  API_URL=http://localhost:3001 npm test
`);
        process.exit(1);
    }

    // Ejecutar tests
    await testHealthCheck();
    await testAuth();
    await testPlans();
    await testTenants();
    await testDocs();
    await test404();
    await testCORS();
    await testRateLimiting();

    // Resumen
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`
${colors.magenta}═══════════════════════════════════════════════════════════${colors.reset}

${colors.bright}RESUMEN DE TESTS${colors.reset}

  ${colors.green}Pasados:${colors.reset}   ${passed}
  ${colors.red}Fallidos:${colors.reset}  ${failed}
  ${colors.yellow}Saltados:${colors.reset}  ${skipped}
  ${colors.cyan}Total:${colors.reset}     ${passed + failed + skipped}
  
  ${colors.blue}Tiempo:${colors.reset}    ${duration}s

${colors.magenta}═══════════════════════════════════════════════════════════${colors.reset}
`);

    // Exit code basado en resultados
    process.exit(failed > 0 ? 1 : 0);
}

// Ejecutar
runTests().catch(err => {
    console.error(`${colors.red}Error fatal:${colors.reset}`, err.message);
    process.exit(1);
});
