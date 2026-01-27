/**
 * PASO 48: Sistema de Backup - NEURIAX Platform
 * Servicio completo de respaldos automáticos y restauración
 * Proyecto Millonario - Calidad Producción
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const zlib = require('zlib');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// =============================================================================
// CONFIGURACIÓN
// =============================================================================

const BACKUP_CONFIG = {
  // Directorio de backups
  BACKUP_DIR: path.join(__dirname, '../backups'),
  
  // Archivo de base de datos
  DATABASE_FILE: path.join(__dirname, '../database/database.json'),
  
  // Configuración de retención
  MAX_BACKUPS: 30,           // Máximo número de backups a mantener
  MAX_AGE_DAYS: 90,          // Máxima antigüedad en días
  
  // Configuración de backup automático
  AUTO_BACKUP_ENABLED: true,
  AUTO_BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 horas
  
  // Prefijos de archivos
  FILE_PREFIX: 'backup_',
  FILE_EXTENSION: '.json.gz',
  
  // Tipos de backup
  TYPES: {
    MANUAL: 'manual',
    AUTO: 'auto',
    SCHEDULED: 'scheduled',
    PRE_UPDATE: 'pre_update'
  }
};

// =============================================================================
// CLASE PRINCIPAL DEL SERVICIO DE BACKUP
// =============================================================================

class BackupService {
  constructor() {
    this.config = BACKUP_CONFIG;
    this.autoBackupTimer = null;
    this.lastBackup = null;
    this.backupHistory = [];
    this.isInitialized = false;
  }

  // ---------------------------------------------------------------------------
  // INICIALIZACIÓN
  // ---------------------------------------------------------------------------

  async initialize() {
    try {
      // Crear directorio de backups si no existe
      await this.ensureBackupDir();
      
      // Cargar historial de backups
      await this.loadBackupHistory();
      
      // Iniciar backup automático si está habilitado
      if (this.config.AUTO_BACKUP_ENABLED) {
        this.startAutoBackup();
      }
      
      this.isInitialized = true;
      console.log('✅ Sistema de Backup inicializado correctamente');
      
      return { success: true, message: 'Backup service initialized' };
    } catch (error) {
      console.error('❌ Error inicializando sistema de backup:', error);
      throw error;
    }
  }

  async ensureBackupDir() {
    try {
      await mkdir(this.config.BACKUP_DIR, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // CREAR BACKUP
  // ---------------------------------------------------------------------------

  async createBackup(options = {}) {
    const {
      type = BACKUP_CONFIG.TYPES.MANUAL,
      description = '',
      compress = true
    } = options;

    try {
      // Leer datos actuales
      const databaseContent = await readFile(this.config.DATABASE_FILE, 'utf8');
      const data = JSON.parse(databaseContent);
      
      // Crear metadata del backup
      const timestamp = new Date();
      const backupId = this.generateBackupId(timestamp);
      
      const backupData = {
        id: backupId,
        type,
        description,
        timestamp: timestamp.toISOString(),
        version: '1.0',
        stats: this.calculateStats(data),
        data
      };
      
      // Generar nombre de archivo
      const filename = `${this.config.FILE_PREFIX}${backupId}${this.config.FILE_EXTENSION}`;
      const filepath = path.join(this.config.BACKUP_DIR, filename);
      
      // Comprimir y guardar
      const jsonString = JSON.stringify(backupData, null, 2);
      
      if (compress) {
        const compressed = await gzip(Buffer.from(jsonString, 'utf8'));
        await writeFile(filepath, compressed);
      } else {
        await writeFile(filepath.replace('.gz', ''), jsonString);
      }
      
      // Actualizar historial
      const backupInfo = {
        id: backupId,
        filename,
        filepath,
        type,
        description,
        timestamp: timestamp.toISOString(),
        size: compress ? (await stat(filepath)).size : Buffer.byteLength(jsonString),
        compressed: compress,
        stats: backupData.stats
      };
      
      this.backupHistory.unshift(backupInfo);
      this.lastBackup = backupInfo;
      
      // Limpiar backups antiguos
      await this.cleanupOldBackups();
      
      console.log(`📦 Backup creado: ${filename}`);
      
      return {
        success: true,
        backup: backupInfo,
        message: `Backup creado exitosamente: ${filename}`
      };
      
    } catch (error) {
      console.error('❌ Error creando backup:', error);
      throw error;
    }
  }

  generateBackupId(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }

  calculateStats(data) {
    return {
      clientes: data.clientes?.length || 0,
      servicios: data.servicios?.length || 0,
      empleados: data.empleados?.length || 0,
      ventas: data.ventas?.length || 0,
      citas: data.citas?.length || 0,
      productos: data.productos?.length || 0,
      movimientos: data.movimientos_caja?.length || 0
    };
  }

  // ---------------------------------------------------------------------------
  // RESTAURAR BACKUP
  // ---------------------------------------------------------------------------

  async restoreBackup(backupId, options = {}) {
    const { createBackupFirst = true } = options;
    
    try {
      // Buscar el backup
      const backupInfo = this.backupHistory.find(b => b.id === backupId);
      
      if (!backupInfo) {
        throw new Error(`Backup no encontrado: ${backupId}`);
      }
      
      // Crear backup de seguridad antes de restaurar
      if (createBackupFirst) {
        await this.createBackup({
          type: BACKUP_CONFIG.TYPES.PRE_UPDATE,
          description: `Backup previo a restauración de ${backupId}`
        });
      }
      
      // Leer y descomprimir backup
      const compressedData = await readFile(backupInfo.filepath);
      const decompressed = await gunzip(compressedData);
      const backupData = JSON.parse(decompressed.toString('utf8'));
      
      // Restaurar datos
      const dataToRestore = JSON.stringify(backupData.data, null, 2);
      await writeFile(this.config.DATABASE_FILE, dataToRestore);
      
      console.log(`🔄 Backup restaurado: ${backupId}`);
      
      return {
        success: true,
        restored: backupInfo,
        stats: backupData.stats,
        message: `Backup ${backupId} restaurado exitosamente`
      };
      
    } catch (error) {
      console.error('❌ Error restaurando backup:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // LISTAR Y GESTIONAR BACKUPS
  // ---------------------------------------------------------------------------

  async loadBackupHistory() {
    try {
      const files = await readdir(this.config.BACKUP_DIR);
      const backupFiles = files.filter(f => 
        f.startsWith(this.config.FILE_PREFIX) && 
        (f.endsWith('.json.gz') || f.endsWith('.json'))
      );
      
      this.backupHistory = [];
      
      for (const filename of backupFiles) {
        const filepath = path.join(this.config.BACKUP_DIR, filename);
        const fileStat = await stat(filepath);
        
        // Extraer ID del nombre del archivo
        const id = filename
          .replace(this.config.FILE_PREFIX, '')
          .replace('.json.gz', '')
          .replace('.json', '');
        
        this.backupHistory.push({
          id,
          filename,
          filepath,
          timestamp: fileStat.mtime.toISOString(),
          size: fileStat.size,
          compressed: filename.endsWith('.gz')
        });
      }
      
      // Ordenar por fecha (más reciente primero)
      this.backupHistory.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      if (this.backupHistory.length > 0) {
        this.lastBackup = this.backupHistory[0];
      }
      
      return this.backupHistory;
      
    } catch (error) {
      console.error('Error cargando historial de backups:', error);
      this.backupHistory = [];
      return [];
    }
  }

  async getBackupList() {
    await this.loadBackupHistory();
    return this.backupHistory.map(b => ({
      id: b.id,
      filename: b.filename,
      timestamp: b.timestamp,
      size: this.formatBytes(b.size),
      sizeBytes: b.size,
      compressed: b.compressed,
      type: b.type || 'unknown',
      description: b.description || ''
    }));
  }

  async getBackupDetails(backupId) {
    const backupInfo = this.backupHistory.find(b => b.id === backupId);
    
    if (!backupInfo) {
      throw new Error(`Backup no encontrado: ${backupId}`);
    }
    
    try {
      const compressedData = await readFile(backupInfo.filepath);
      const decompressed = await gunzip(compressedData);
      const backupData = JSON.parse(decompressed.toString('utf8'));
      
      return {
        ...backupInfo,
        stats: backupData.stats,
        version: backupData.version,
        type: backupData.type,
        description: backupData.description
      };
    } catch (error) {
      return {
        ...backupInfo,
        error: 'No se pudo leer los detalles del backup'
      };
    }
  }

  async deleteBackup(backupId) {
    const backupIndex = this.backupHistory.findIndex(b => b.id === backupId);
    
    if (backupIndex === -1) {
      throw new Error(`Backup no encontrado: ${backupId}`);
    }
    
    const backupInfo = this.backupHistory[backupIndex];
    
    try {
      await unlink(backupInfo.filepath);
      this.backupHistory.splice(backupIndex, 1);
      
      console.log(`🗑️ Backup eliminado: ${backupId}`);
      
      return {
        success: true,
        deleted: backupId,
        message: `Backup ${backupId} eliminado exitosamente`
      };
    } catch (error) {
      console.error('Error eliminando backup:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // LIMPIEZA AUTOMÁTICA
  // ---------------------------------------------------------------------------

  async cleanupOldBackups() {
    const now = new Date();
    const maxAge = this.config.MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    
    // Eliminar por antigüedad
    const toDelete = this.backupHistory.filter(b => {
      const age = now - new Date(b.timestamp);
      return age > maxAge;
    });
    
    // Eliminar por cantidad (mantener solo MAX_BACKUPS)
    const sortedBackups = [...this.backupHistory].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    if (sortedBackups.length > this.config.MAX_BACKUPS) {
      const excess = sortedBackups.slice(this.config.MAX_BACKUPS);
      excess.forEach(b => {
        if (!toDelete.find(d => d.id === b.id)) {
          toDelete.push(b);
        }
      });
    }
    
    // Ejecutar eliminación
    for (const backup of toDelete) {
      try {
        await this.deleteBackup(backup.id);
      } catch (error) {
        console.error(`Error eliminando backup antiguo ${backup.id}:`, error);
      }
    }
    
    return {
      deleted: toDelete.length,
      remaining: this.backupHistory.length
    };
  }

  // ---------------------------------------------------------------------------
  // BACKUP AUTOMÁTICO
  // ---------------------------------------------------------------------------

  startAutoBackup() {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
    }
    
    this.autoBackupTimer = setInterval(async () => {
      try {
        await this.createBackup({
          type: BACKUP_CONFIG.TYPES.AUTO,
          description: 'Backup automático programado'
        });
      } catch (error) {
        console.error('Error en backup automático:', error);
      }
    }, this.config.AUTO_BACKUP_INTERVAL);
    
    console.log('🔄 Backup automático activado (cada 24 horas)');
  }

  stopAutoBackup() {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
      this.autoBackupTimer = null;
      console.log('⏹️ Backup automático desactivado');
    }
  }

  // ---------------------------------------------------------------------------
  // EXPORTAR/IMPORTAR
  // ---------------------------------------------------------------------------

  async exportToFile(backupId, outputPath) {
    const backupInfo = this.backupHistory.find(b => b.id === backupId);
    
    if (!backupInfo) {
      throw new Error(`Backup no encontrado: ${backupId}`);
    }
    
    const compressedData = await readFile(backupInfo.filepath);
    const decompressed = await gunzip(compressedData);
    
    await writeFile(outputPath, decompressed);
    
    return {
      success: true,
      exported: outputPath,
      size: decompressed.length
    };
  }

  async importFromFile(filePath, options = {}) {
    const { description = 'Backup importado' } = options;
    
    try {
      const content = await readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      
      // Validar estructura
      if (!data.clientes && !data.servicios && !data.data) {
        throw new Error('Formato de archivo inválido');
      }
      
      // Si es un backup completo con metadata
      const importData = data.data || data;
      
      // Crear backup antes de importar
      await this.createBackup({
        type: BACKUP_CONFIG.TYPES.PRE_UPDATE,
        description: 'Backup previo a importación'
      });
      
      // Guardar datos importados
      await writeFile(
        this.config.DATABASE_FILE, 
        JSON.stringify(importData, null, 2)
      );
      
      // Crear registro del backup importado
      await this.createBackup({
        type: BACKUP_CONFIG.TYPES.MANUAL,
        description
      });
      
      return {
        success: true,
        message: 'Datos importados exitosamente',
        stats: this.calculateStats(importData)
      };
      
    } catch (error) {
      console.error('Error importando archivo:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // UTILIDADES
  // ---------------------------------------------------------------------------

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      autoBackupEnabled: !!this.autoBackupTimer,
      totalBackups: this.backupHistory.length,
      lastBackup: this.lastBackup ? {
        id: this.lastBackup.id,
        timestamp: this.lastBackup.timestamp,
        size: this.formatBytes(this.lastBackup.size)
      } : null,
      config: {
        maxBackups: this.config.MAX_BACKUPS,
        maxAgeDays: this.config.MAX_AGE_DAYS,
        autoBackupInterval: this.config.AUTO_BACKUP_INTERVAL / (60 * 60 * 1000) + ' horas'
      }
    };
  }
}

// =============================================================================
// INSTANCIA SINGLETON
// =============================================================================

const backupService = new BackupService();

// =============================================================================
// RUTAS EXPRESS
// =============================================================================

const createBackupRoutes = (router) => {
  const { verificarToken, verificarAdmin } = require('../middleware/auth');

  // Obtener estado del sistema de backup
  router.get('/backup/status', verificarToken, async (req, res) => {
    try {
      const status = backupService.getStatus();
      res.json({ success: true, ...status });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Listar backups
  router.get('/backup/list', verificarToken, async (req, res) => {
    try {
      const backups = await backupService.getBackupList();
      res.json({ success: true, backups, total: backups.length });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Crear backup manual
  router.post('/backup/create', verificarToken, verificarAdmin, async (req, res) => {
    try {
      const { description } = req.body;
      const result = await backupService.createBackup({
        type: BACKUP_CONFIG.TYPES.MANUAL,
        description: description || 'Backup manual'
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Obtener detalles de un backup
  router.get('/backup/:id', verificarToken, async (req, res) => {
    try {
      const details = await backupService.getBackupDetails(req.params.id);
      res.json({ success: true, backup: details });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  // Restaurar backup
  router.post('/backup/:id/restore', verificarToken, verificarAdmin, async (req, res) => {
    try {
      const result = await backupService.restoreBackup(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Eliminar backup
  router.delete('/backup/:id', verificarToken, verificarAdmin, async (req, res) => {
    try {
      const result = await backupService.deleteBackup(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Descargar backup
  router.get('/backup/:id/download', verificarToken, async (req, res) => {
    try {
      const backupInfo = backupService.backupHistory.find(b => b.id === req.params.id);
      if (!backupInfo) {
        return res.status(404).json({ success: false, error: 'Backup no encontrado' });
      }
      
      res.download(backupInfo.filepath, backupInfo.filename);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Limpiar backups antiguos
  router.post('/backup/cleanup', verificarToken, verificarAdmin, async (req, res) => {
    try {
      const result = await backupService.cleanupOldBackups();
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  backupService,
  BackupService,
  BACKUP_CONFIG,
  createBackupRoutes
};
