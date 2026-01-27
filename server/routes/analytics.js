const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');

let analyticsDatabase = {
  metrics: {},
  reports: [],
  predictions: {},
  snapshots: []
};

router.get('/metrics', verificarToken, (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    let metrics = analyticsDatabase.metrics;
    if (type) {
      metrics = metrics[type] || null;
    }

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/snapshots', verificarToken, (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const snapshots = analyticsDatabase.snapshots
      .slice(-limit)
      .reverse();

    res.json({
      success: true,
      data: snapshots,
      total: analyticsDatabase.snapshots.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/capture-event', verificarToken, (req, res) => {
  try {
    const { eventType, eventData } = req.body;

    if (!eventType || !eventData) {
      return res.status(400).json({
        success: false,
        message: 'eventType y eventData son requeridos'
      });
    }

    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      data: eventData,
      timestamp: new Date().toISOString(),
      userId: req.user.id
    };

    if (!analyticsDatabase.metrics[eventType]) {
      analyticsDatabase.metrics[eventType] = {
        count: 0,
        total: 0,
        lastUpdated: new Date().toISOString()
      };
    }

    analyticsDatabase.metrics[eventType].count += 1;
    if (eventData.value !== undefined) {
      analyticsDatabase.metrics[eventType].total += eventData.value;
    }
    analyticsDatabase.metrics[eventType].lastUpdated = new Date().toISOString();

    res.json({
      success: true,
      data: event,
      message: 'Evento capturado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/reports', verificarToken, (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    
    let reports = analyticsDatabase.reports;
    if (type) {
      reports = reports.filter(r => r.type === type);
    }

    reports = reports.slice(-limit).reverse();

    res.json({
      success: true,
      data: reports,
      total: analyticsDatabase.reports.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/generate-report', verificarToken, (req, res) => {
  try {
    const { reportType, data, dateRange } = req.body;

    if (!reportType || !data) {
      return res.status(400).json({
        success: false,
        message: 'reportType y data son requeridos'
      });
    }

    const report = {
      id: `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: reportType,
      generatedAt: new Date().toISOString(),
      dateRange: dateRange || 'custom',
      sections: data,
      generatedBy: req.user.id
    };

    analyticsDatabase.reports.push(report);

    res.json({
      success: true,
      data: report,
      message: 'Reporte generado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/reports/:reportId', verificarToken, (req, res) => {
  try {
    const { reportId } = req.params;
    const report = analyticsDatabase.reports.find(r => r.id === reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/export-report/:reportId', verificarToken, (req, res) => {
  try {
    const { reportId } = req.params;
    const { format = 'json' } = req.body;

    const report = analyticsDatabase.reports.find(r => r.id === reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    let exported;
    if (format === 'json') {
      exported = JSON.stringify(report, null, 2);
    } else if (format === 'csv') {
      exported = convertToCSV(report);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Formato no soportado. Use json o csv'
      });
    }

    res.json({
      success: true,
      data: exported,
      format: format,
      filename: `report_${reportId}.${format}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/predictions/:type', verificarToken, (req, res) => {
  try {
    const { type } = req.params;
    const prediction = analyticsDatabase.predictions[type];

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Predicción no encontrada'
      });
    }

    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/predict', verificarToken, (req, res) => {
  try {
    const { type, data, periods = 30 } = req.body;

    if (!type || !data) {
      return res.status(400).json({
        success: false,
        message: 'type y data son requeridos'
      });
    }

    const predictions = generatePredictions(data, periods);

    analyticsDatabase.predictions[type] = {
      id: `pred_${Date.now()}`,
      type: type,
      generatedAt: new Date().toISOString(),
      periods: periods,
      predictions: predictions,
      confidence: 0.85
    };

    res.json({
      success: true,
      data: analyticsDatabase.predictions[type]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/snapshot', verificarToken, (req, res) => {
  try {
    const { data, label } = req.body;

    const snapshot = {
      id: `snap_${Date.now()}`,
      label: label || 'Snapshot',
      timestamp: new Date().toISOString(),
      data: data
    };

    analyticsDatabase.snapshots.push(snapshot);

    res.json({
      success: true,
      data: snapshot,
      message: 'Snapshot guardado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/comparison', verificarToken, (req, res) => {
  try {
    const { period1, period2, metric } = req.query;

    const comparison = {
      metric: metric,
      period1: period1,
      period2: period2,
      change: 0,
      percentChange: 0,
      trend: 'stable'
    };

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/anomalies', verificarToken, (req, res) => {
  try {
    const { type, threshold = 2 } = req.query;

    const anomalies = {
      type: type,
      threshold: threshold,
      detected: [],
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: anomalies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/alerts', verificarToken, (req, res) => {
  try {
    const { severity = null } = req.query;

    let alerts = [
      {
        id: 'alert_1',
        severity: 'high',
        type: 'revenue',
        message: 'Ingresos por debajo de lo esperado',
        timestamp: new Date().toISOString()
      }
    ];

    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }

    res.json({
      success: true,
      data: alerts,
      total: alerts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/clear-analytics', verificarToken, (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden limpiar analytics'
      });
    }

    analyticsDatabase = {
      metrics: {},
      reports: [],
      predictions: {},
      snapshots: []
    };

    res.json({
      success: true,
      message: 'Base de datos de analytics limpiada'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

function generatePredictions(data, periods) {
  const predictions = [];
  for (let i = 1; i <= periods; i++) {
    predictions.push({
      period: i,
      value: Math.random() * 100000,
      confidence: 0.85 - (i * 0.01)
    });
  }
  return predictions;
}

function convertToCSV(report) {
  let csv = `Report Type,${report.type}\n`;
  csv += `Generated At,${report.generatedAt}\n\n`;
  
  Object.entries(report.sections).forEach(([sectionName, sectionData]) => {
    csv += `${sectionName}\n`;
    if (Array.isArray(sectionData)) {
      if (sectionData.length > 0) {
        const headers = Object.keys(sectionData[0]);
        csv += headers.join(',') + '\n';
        sectionData.forEach(item => {
          csv += headers.map(h => item[h]).join(',') + '\n';
        });
      }
    }
    csv += '\n';
  });

  return csv;
}

module.exports = router;
