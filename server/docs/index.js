/**
 * PASO 52: Middleware y Rutas para Documentación API
 * Sirve la documentación interactiva con Swagger UI
 */

const swaggerDefinition = require('./swagger');

/**
 * Genera el HTML para Swagger UI
 */
function generateSwaggerHTML(spec) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation - NEURIAX Platform</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E💈%3C/text%3E%3C/svg%3E">
  <style>
    * {
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .swagger-ui .topbar {
      display: none;
    }
    
    .custom-header {
      background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
      color: white;
      padding: 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .custom-header h1 {
      margin: 0;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .custom-header .logo {
      font-size: 2rem;
    }
    
    .custom-header .version {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.875rem;
    }
    
    .header-links {
      display: flex;
      gap: 1rem;
    }
    
    .header-links a {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.15);
      transition: background 0.2s;
    }
    
    .header-links a:hover {
      background: rgba(255, 255, 255, 0.25);
    }
    
    .swagger-ui .info {
      margin: 30px 0;
    }
    
    .swagger-ui .info .title {
      color: #1f2937;
    }
    
    .swagger-ui .info .description {
      font-size: 14px;
      color: #4b5563;
    }
    
    .swagger-ui .opblock-tag {
      font-size: 1.1rem !important;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .swagger-ui .opblock.opblock-post {
      border-color: #22c55e;
      background: rgba(34, 197, 94, 0.05);
    }
    
    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: #22c55e;
    }
    
    .swagger-ui .opblock.opblock-get {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.05);
    }
    
    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: #3b82f6;
    }
    
    .swagger-ui .opblock.opblock-put {
      border-color: #f59e0b;
      background: rgba(245, 158, 11, 0.05);
    }
    
    .swagger-ui .opblock.opblock-put .opblock-summary-method {
      background: #f59e0b;
    }
    
    .swagger-ui .opblock.opblock-delete {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.05);
    }
    
    .swagger-ui .opblock.opblock-delete .opblock-summary-method {
      background: #ef4444;
    }
    
    .swagger-ui .btn.execute {
      background: #8b5cf6 !important;
      border-color: #8b5cf6 !important;
    }
    
    .swagger-ui .btn.execute:hover {
      background: #7c3aed !important;
    }
    
    .swagger-ui .btn.authorize {
      color: #22c55e !important;
      border-color: #22c55e !important;
    }
    
    .swagger-ui .btn.authorize svg {
      fill: #22c55e !important;
    }
    
    .swagger-ui section.models {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    
    .swagger-ui section.models h4 {
      color: #1f2937;
    }
    
    .quick-start {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1rem 2rem;
    }
    
    .quick-start h3 {
      margin-top: 0;
      color: #15803d;
    }
    
    .quick-start code {
      background: #dcfce7;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.9rem;
    }
    
    .quick-start pre {
      background: #1f2937;
      color: #e5e7eb;
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
    }
    
    @media (max-width: 768px) {
      .custom-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
      
      .quick-start {
        margin: 1rem;
      }
    }
  </style>
</head>
<body>
  <header class="custom-header">
    <h1>
      <span class="logo">💈</span>
      NEURIAX Platform - API
      <span class="version">v2.0.0</span>
    </h1>
    <div class="header-links">
      <a href="http://localhost:3000" target="_blank">🖥️ App</a>
      <a href="/health" target="_blank">💚 Health</a>
      <a href="/api/docs/json" target="_blank">📄 JSON</a>
    </div>
  </header>
  
  <div class="quick-start">
    <h3>🚀 Inicio Rápido</h3>
    <p>Para autenticarte y probar los endpoints:</p>
    <ol>
      <li>Haz clic en el botón <strong>Authorize</strong> 🔓</li>
      <li>Primero ejecuta <code>POST /api/auth/login</code> con: <code>{"username": "admin", "password": "admin123"}</code></li>
      <li>Copia el token de la respuesta</li>
      <li>Pégalo en el modal de autorización con formato: <code>Bearer tu_token_aqui</code></li>
    </ol>
    <pre>curl -X POST http://localhost:3001/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin","password":"admin123"}'</pre>
  </div>
  
  <div id="swagger-ui"></div>
  
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        spec: ${JSON.stringify(spec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 2,
        docExpansion: "list",
        filter: true,
        showRequestDuration: true,
        syntaxHighlight: {
          activate: true,
          theme: "monokai"
        }
      });
      
      window.ui = ui;
    };
  </script>
</body>
</html>
  `;
}

/**
 * Crea las rutas de documentación
 */
function createDocsRoutes(app) {
  // Servir documentación interactiva
  app.get('/api/docs', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(generateSwaggerHTML(swaggerDefinition));
  });
  
  // Servir especificación OpenAPI en JSON
  app.get('/api/docs/json', (req, res) => {
    res.json(swaggerDefinition);
  });
  
  // Servir especificación OpenAPI en YAML (texto plano)
  app.get('/api/docs/yaml', (req, res) => {
    const yaml = jsonToYaml(swaggerDefinition);
    res.setHeader('Content-Type', 'text/yaml');
    res.send(yaml);
  });
  
  // Redoc (documentación alternativa)
  app.get('/api/redoc', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>API Docs - Redoc</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  <style>body { margin: 0; padding: 0; }</style>
</head>
<body>
  <redoc spec-url='/api/docs/json'></redoc>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>
    `);
  });
  
  console.log('✓ Documentación API disponible en /api/docs');
}

/**
 * Convertir JSON a YAML básico
 */
function jsonToYaml(obj, indent = 0) {
  let yaml = '';
  const spaces = '  '.repeat(indent);
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      yaml += `${spaces}${key}: null\n`;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      yaml += `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`;
    } else if (Array.isArray(value)) {
      yaml += `${spaces}${key}:\n`;
      value.forEach(item => {
        if (typeof item === 'object') {
          yaml += `${spaces}- \n${jsonToYaml(item, indent + 2)}`;
        } else {
          yaml += `${spaces}- ${item}\n`;
        }
      });
    } else if (typeof value === 'string') {
      yaml += `${spaces}${key}: "${value}"\n`;
    } else {
      yaml += `${spaces}${key}: ${value}\n`;
    }
  }
  
  return yaml;
}

module.exports = {
  swaggerDefinition,
  createDocsRoutes,
  generateSwaggerHTML
};
