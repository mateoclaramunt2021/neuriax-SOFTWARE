#!/bin/bash
# ============================================================
# PASO 58: Script de Despliegue - NEURIAX Platform
# ============================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║       NEURIAX Platform - SCRIPT DE DESPLIEGUE         ║"
echo "║                    Versión 1.0.0                          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Variables
DOMAIN=${DOMAIN:-"neuriax.com"}
EMAIL=${SSL_EMAIL:-"admin@neuriax.com"}
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Funciones
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================================
# VERIFICAR REQUISITOS
# ============================================================
check_requirements() {
    log_info "Verificando requisitos del sistema..."

    # Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker no está instalado"
        exit 1
    fi
    log_success "Docker instalado: $(docker --version)"

    # Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose no está instalado"
        exit 1
    fi
    log_success "Docker Compose instalado"

    # Archivo .env
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Archivo .env no encontrado"
        if [ -f ".env.example" ]; then
            log_info "Copiando .env.example a .env..."
            cp .env.example .env
            log_warning "Por favor, edita el archivo .env con tus configuraciones"
            exit 1
        else
            log_error "No se encontró .env.example"
            exit 1
        fi
    fi
    log_success "Archivo .env encontrado"
}

# ============================================================
# CONFIGURAR SSL CON LET'S ENCRYPT
# ============================================================
setup_ssl() {
    log_info "Configurando SSL con Let's Encrypt..."

    # Crear directorios para certificados
    mkdir -p certbot/conf certbot/www

    # Verificar si ya existen certificados
    if [ -d "certbot/conf/live/$DOMAIN" ]; then
        log_success "Certificados SSL ya existen para $DOMAIN"
        return 0
    fi

    # Descargar parámetros TLS recomendados
    if [ ! -f "certbot/conf/options-ssl-nginx.conf" ]; then
        log_info "Descargando configuración SSL recomendada..."
        curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > certbot/conf/options-ssl-nginx.conf
        curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > certbot/conf/ssl-dhparams.pem
    fi

    # Crear certificado dummy para iniciar nginx
    log_info "Creando certificado temporal..."
    mkdir -p "certbot/conf/live/$DOMAIN"
    openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
        -keyout "certbot/conf/live/$DOMAIN/privkey.pem" \
        -out "certbot/conf/live/$DOMAIN/fullchain.pem" \
        -subj "/CN=localhost" 2>/dev/null
    cp "certbot/conf/live/$DOMAIN/fullchain.pem" "certbot/conf/live/$DOMAIN/chain.pem"

    # Iniciar nginx con certificado temporal
    log_info "Iniciando Nginx temporalmente..."
    docker-compose up -d nginx

    # Eliminar certificado temporal
    rm -rf "certbot/conf/live/$DOMAIN"

    # Obtener certificado real
    log_info "Obteniendo certificado SSL de Let's Encrypt..."
    docker-compose run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d www.$DOMAIN \
        -d api.$DOMAIN

    # Reiniciar nginx con certificado real
    docker-compose restart nginx

    log_success "Certificado SSL configurado correctamente"
}

# ============================================================
# CONSTRUIR IMÁGENES
# ============================================================
build_images() {
    log_info "Construyendo imágenes Docker..."

    docker-compose build --no-cache api
    log_success "Imagen API construida"

    docker-compose build --no-cache client
    log_success "Imagen Client construida"
}

# ============================================================
# INICIAR SERVICIOS
# ============================================================
start_services() {
    log_info "Iniciando servicios..."

    # Iniciar PostgreSQL primero
    docker-compose up -d postgres
    log_info "Esperando a que PostgreSQL esté listo..."
    sleep 10

    # Verificar PostgreSQL
    docker-compose exec -T postgres pg_isready -U begona_admin -d begona_gomez_db
    log_success "PostgreSQL está listo"

    # Iniciar API
    docker-compose up -d api
    log_info "Esperando a que la API esté lista..."
    sleep 10
    log_success "API iniciada"

    # Iniciar Cliente
    docker-compose up -d client
    log_success "Cliente iniciado"

    # Iniciar Nginx
    docker-compose up -d nginx
    log_success "Nginx iniciado"

    # Iniciar Certbot
    docker-compose up -d certbot
    log_success "Certbot iniciado"
}

# ============================================================
# VERIFICAR ESTADO
# ============================================================
check_status() {
    log_info "Verificando estado de los servicios..."
    echo ""

    docker-compose ps

    echo ""
    log_info "Health checks:"

    # API Health
    if curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
        log_success "API: Funcionando correctamente"
    else
        log_warning "API: No responde (puede estar iniciando)"
    fi

    # Client Health
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
        log_success "Cliente: Funcionando correctamente"
    else
        log_warning "Cliente: No responde (puede estar iniciando)"
    fi

    # PostgreSQL
    if docker-compose exec -T postgres pg_isready -U begona_admin -d begona_gomez_db > /dev/null 2>&1; then
        log_success "PostgreSQL: Funcionando correctamente"
    else
        log_warning "PostgreSQL: No responde"
    fi
}

# ============================================================
# MOSTRAR LOGS
# ============================================================
show_logs() {
    log_info "Mostrando logs de todos los servicios..."
    docker-compose logs -f --tail=100
}

# ============================================================
# PARAR SERVICIOS
# ============================================================
stop_services() {
    log_info "Parando todos los servicios..."
    docker-compose down
    log_success "Servicios parados"
}

# ============================================================
# BACKUP BASE DE DATOS
# ============================================================
backup_database() {
    log_info "Creando backup de la base de datos..."
    
    BACKUP_DIR="./backups"
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p $BACKUP_DIR
    
    docker-compose exec -T postgres pg_dump -U begona_admin begona_gomez_db > "$BACKUP_FILE"
    
    gzip "$BACKUP_FILE"
    
    log_success "Backup creado: ${BACKUP_FILE}.gz"
}

# ============================================================
# RESTAURAR BACKUP
# ============================================================
restore_database() {
    if [ -z "$1" ]; then
        log_error "Especifica el archivo de backup"
        echo "Uso: $0 restore <archivo.sql.gz>"
        exit 1
    fi

    BACKUP_FILE="$1"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Archivo no encontrado: $BACKUP_FILE"
        exit 1
    fi

    log_warning "¡ATENCIÓN! Esto sobrescribirá la base de datos actual"
    read -p "¿Continuar? (s/N): " confirm
    
    if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
        log_info "Operación cancelada"
        exit 0
    fi

    log_info "Restaurando backup..."
    
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        gunzip -c "$BACKUP_FILE" | docker-compose exec -T postgres psql -U begona_admin begona_gomez_db
    else
        docker-compose exec -T postgres psql -U begona_admin begona_gomez_db < "$BACKUP_FILE"
    fi
    
    log_success "Backup restaurado correctamente"
}

# ============================================================
# RENOVAR SSL
# ============================================================
renew_ssl() {
    log_info "Renovando certificados SSL..."
    docker-compose run --rm certbot renew
    docker-compose restart nginx
    log_success "Certificados renovados"
}

# ============================================================
# LIMPIAR SISTEMA
# ============================================================
cleanup() {
    log_warning "Esto eliminará contenedores parados, imágenes no usadas y volúmenes huérfanos"
    read -p "¿Continuar? (s/N): " confirm
    
    if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
        log_info "Operación cancelada"
        exit 0
    fi

    log_info "Limpiando sistema Docker..."
    docker system prune -af
    log_success "Sistema limpiado"
}

# ============================================================
# ACTUALIZAR APLICACIÓN
# ============================================================
update() {
    log_info "Actualizando aplicación..."

    # Backup antes de actualizar
    backup_database

    # Pull últimos cambios
    git pull origin main

    # Reconstruir imágenes
    build_images

    # Reiniciar servicios
    docker-compose up -d

    log_success "Aplicación actualizada"
}

# ============================================================
# MENÚ PRINCIPAL
# ============================================================
show_help() {
    echo -e "${CYAN}Uso: $0 <comando>${NC}"
    echo ""
    echo "Comandos disponibles:"
    echo "  deploy      - Despliegue completo (build + start + SSL)"
    echo "  start       - Iniciar todos los servicios"
    echo "  stop        - Parar todos los servicios"
    echo "  restart     - Reiniciar todos los servicios"
    echo "  status      - Ver estado de los servicios"
    echo "  logs        - Ver logs en tiempo real"
    echo "  build       - Reconstruir imágenes"
    echo "  ssl         - Configurar/renovar SSL"
    echo "  backup      - Crear backup de la base de datos"
    echo "  restore     - Restaurar backup (requiere archivo)"
    echo "  update      - Actualizar aplicación"
    echo "  cleanup     - Limpiar recursos Docker no usados"
    echo "  help        - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 deploy              # Despliegue completo"
    echo "  $0 restore backup.sql.gz  # Restaurar backup"
}

# ============================================================
# MAIN
# ============================================================
case "$1" in
    deploy)
        check_requirements
        build_images
        start_services
        setup_ssl
        check_status
        echo ""
        log_success "¡Despliegue completado!"
        echo -e "  Frontend: ${GREEN}https://$DOMAIN${NC}"
        echo -e "  API:      ${GREEN}https://api.$DOMAIN${NC}"
        echo -e "  Docs:     ${GREEN}https://api.$DOMAIN/api/docs${NC}"
        ;;
    start)
        check_requirements
        start_services
        check_status
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        start_services
        check_status
        ;;
    status)
        check_status
        ;;
    logs)
        show_logs
        ;;
    build)
        build_images
        ;;
    ssl)
        setup_ssl
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database "$2"
        ;;
    update)
        update
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Comando no reconocido: $1"
        show_help
        exit 1
        ;;
esac
