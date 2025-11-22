#!/bin/bash
# test-commit.sh - Script para probar la configuración de Husky

echo "🧪 Probando configuración de Husky y Commitlint..."
echo ""

# Crear un archivo temporal para probar
echo "test" > test-file.txt
git add test-file.txt

echo "✅ Intentando commit válido..."
git commit -m "chore: probar configuración de husky"

if [ $? -eq 0 ]; then
    echo "✅ Commit válido aceptado!"
    git reset --soft HEAD~1
    git reset HEAD test-file.txt
    rm test-file.txt
    echo ""
    echo "❌ Intentando commit inválido..."
    echo "test" > test-file.txt
    git add test-file.txt
    git commit -m "invalid commit message" 2>&1 | grep -q "subject may not be empty"
    
    if [ $? -eq 0 ]; then
        echo "✅ Commit inválido rechazado correctamente!"
        git reset HEAD test-file.txt
        rm test-file.txt
        echo ""
        echo "🎉 ¡Husky está configurado correctamente!"
    else
        echo "⚠️ El commit inválido no fue rechazado"
        git reset HEAD test-file.txt
        rm test-file.txt
    fi
else
    echo "❌ El commit válido fue rechazado"
    git reset HEAD test-file.txt
    rm test-file.txt
fi
