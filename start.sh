#!/bin/bash

# Script para iniciar Sistema de Cobros v2.0 Enterprise
# ========================================================

echo "🚀 Iniciando Sistema de Cobros v2.0 Enterprise..."
echo ""

# Verificar .env
if [ ! -f ".env" ]; then
  echo "⚠️  Archivo .env no encontrado"
  exit 1
fi

# Iniciar backend
echo "📱 Iniciando Backend (Puerto 3001)..."
cd server
npm start &
BACKEND_PID=$!

sleep 3

# Iniciar frontend
echo "🎨 Iniciando Frontend (Puerto 3000)..."
cd ../client
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Sistema iniciado:"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Presiona Ctrl+C para detener"

wait
