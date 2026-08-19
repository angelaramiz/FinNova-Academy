#!/bin/bash
# pre-commit hook para validacion rapida de superficies web del proyecto

echo "🔍 Ejecutando pre-commit validations..."

# 1. Validar Alumnos
echo "Checking alumnos compilation..."
cd alumnos && npm run lint || exit 1
cd ..

# 2. Validar Staff
echo "Checking staff compilation..."
cd staff && npm run lint || exit 1
cd ..

echo "✅ All compilations passed successfully!"
exit 0
