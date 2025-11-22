#!/bin/bash
# backend/scripts/verify-pyth-setup.sh
# Script para verificar que el módulo Pyth está correctamente configurado

echo "🔍 Verificando configuración del módulo Pyth..."
echo ""

# Verificar variables de entorno
echo "📋 Variables de entorno requeridas:"
echo ""

check_env() {
  local var_name=$1
  local required=$2
  
  if [ -z "${!var_name}" ]; then
    if [ "$required" = "true" ]; then
      echo "❌ $var_name - FALTA (requerida)"
      return 1
    else
      echo "⚠️  $var_name - No configurada (opcional)"
      return 0
    fi
  else
    echo "✅ $var_name - Configurada"
    return 0
  fi
}

# Cargar .env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "❌ Archivo .env no encontrado"
  exit 1
fi

# Variables core (requeridas)
check_env "PYTH_HERMES_URL" "false"
check_env "PYTH_UPDATER_PRIVATE_KEY" "true"
check_env "PYTH_DEFAULT_UPDATE_FEE_WEI" "false"

echo ""
echo "🌐 Redes configuradas:"
echo ""

# Check Sepolia
if check_env "SEPOLIA_RPC_URL" "false" && check_env "PYTH_CONSUMER_SEPOLIA" "false"; then
  echo "   ✅ Sepolia - Completa"
else
  echo "   ⚠️  Sepolia - Incompleta"
fi

# Check Base Sepolia
if check_env "BASE_SEPOLIA_RPC_URL" "false" && check_env "PYTH_CONSUMER_BASE_SEPOLIA" "false"; then
  echo "   ✅ Base Sepolia - Completa"
else
  echo "   ⚠️  Base Sepolia - Incompleta"
fi

echo ""
echo "📦 Verificando archivos del módulo:"
echo ""

check_file() {
  local file=$1
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file - FALTA"
  fi
}

check_file "src/pyth/pyth.module.ts"
check_file "src/pyth/pyth.service.ts"
check_file "src/pyth/pyth.controller.ts"
check_file "src/pyth/pyth-feeds.config.ts"
check_file "src/pyth/pyth-networks.config.ts"
check_file "src/pyth/dto/get-pyth-price.dto.ts"
check_file "src/pyth/dto/get-pyth-multi-price.dto.ts"
check_file "src/pyth/abi/PythPriceConsumer.json"
check_file "src/pyth/abi/index.ts"

echo ""
echo "🔧 Verificando dependencias npm:"
echo ""

if npm list ethers > /dev/null 2>&1; then
  echo "✅ ethers"
else
  echo "❌ ethers - NO INSTALADA"
fi

if npm list @nestjs/axios > /dev/null 2>&1; then
  echo "✅ @nestjs/axios"
else
  echo "❌ @nestjs/axios - NO INSTALADA"
fi

echo ""
echo "🏗️  Compilación TypeScript:"
echo ""

if npm run build > /dev/null 2>&1; then
  echo "✅ Compilación exitosa"
else
  echo "❌ Errores de compilación"
  echo ""
  echo "Ejecuta 'npm run build' para ver los detalles"
fi

echo ""
echo "✨ Verificación completada!"
echo ""
echo "Para probar el módulo:"
echo "  1. npm run start:dev"
echo "  2. curl \"http://localhost:3000/pyth/price?feedKey=ETH_USD&network=sepolia&mode=read-only\""
echo ""
