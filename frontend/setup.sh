#!/bin/bash

# Script de instalación del frontend
# Imperia Dashboard - Morpheus

set -e

echo "======================================"
echo "Imperia Dashboard - Frontend Setup"
echo "======================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar Node.js
echo -e "${YELLOW}Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    echo "Por favor instala Node.js 20+ desde: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} encontrado${NC}"
echo ""

# Verificar npm
echo -e "${YELLOW}Verificando npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm no está instalado${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✓ npm ${NPM_VERSION} encontrado${NC}"
echo ""

# Instalar dependencias
echo -e "${YELLOW}Instalando dependencias...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencias instaladas correctamente${NC}"
else
    echo -e "${RED}❌ Error instalando dependencias${NC}"
    exit 1
fi
echo ""

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creando archivo .env...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Archivo .env creado${NC}"
    echo -e "${YELLOW}⚠️  Recuerda configurar las variables de entorno en .env${NC}"
else
    echo -e "${GREEN}✓ Archivo .env ya existe${NC}"
fi
echo ""

# Mensaje final
echo ""
echo "======================================"
echo -e "${GREEN}✨ Setup completado exitosamente ✨${NC}"
echo "======================================"
echo ""
echo "Para iniciar el servidor de desarrollo:"
echo -e "  ${YELLOW}npm run dev${NC}"
echo ""
echo "Para construir para producción:"
echo -e "  ${YELLOW}npm run build${NC}"
echo ""
echo "Para construir la imagen Docker:"
echo -e "  ${YELLOW}docker build -t imperia-frontend .${NC}"
echo ""
