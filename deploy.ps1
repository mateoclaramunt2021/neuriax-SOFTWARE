#Requires -Version 5.0

<#
.SYNOPSIS
    Script de despliegue para NEURIAX Platform en Windows.

.DESCRIPTION
    Automatiza el despliegue, arranque y gestión de la aplicación NEURIAX.

.PARAMETER Command
    Comando a ejecutar: start, stop, restart, status, install, build, test, backup, clean, check, help.

.EXAMPLE
    .\deploy.ps1 start
    Inicia los servicios backend y frontend.

.EXAMPLE
    .\deploy.ps1 status
    Muestra el estado de los servicios.
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('start', 'stop', 'restart', 'status', 'install', 'build', 'test', 'backup', 'clean', 'check', 'help')]
    [string]$Command = 'help'
)

Set-StrictMode -Version Latest

$script:Colors = @{
    Success = 'Green'
    Error   = 'Red'
    Warning = 'Yellow'
    Info    = 'Cyan'
    Title   = 'Magenta'
}

function Write-Title {
    [CmdletBinding()]
    param()

    Write-Host ''
    Write-Host '╔═══════════════════════════════════════════════════════════╗' -ForegroundColor $script:Colors.Title
    Write-Host '║       NEURIAX Platform - SCRIPT DE DESPLIEGUE             ║' -ForegroundColor $script:Colors.Title
    Write-Host '║                    Versión 1.0.0                          ║' -ForegroundColor $script:Colors.Title
    Write-Host '╚═══════════════════════════════════════════════════════════╝' -ForegroundColor $script:Colors.Title
    Write-Host ''
}

function Write-Log {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNullOrEmpty()]
        [string]$Message,

        [Parameter(Position = 1)]
        [ValidateSet('Success', 'Error', 'Warning', 'Info')]
        [string]$Type = 'Info'
    )

    $prefix = switch ($Type) {
        'Success' { '[OK]' }
        'Error' { '[ERROR]' }
        'Warning' { '[WARN]' }
        default { '[INFO]' }
    }

    Write-Host $prefix -NoNewline -ForegroundColor $script:Colors[$Type]
    Write-Host " $Message"
}

function Test-Requirements {
    [CmdletBinding()]
    [OutputType([bool])]
    param()

    Write-Log -Message 'Verificando requisitos del sistema...' -Type 'Info'

    $nodeVersion = & node --version 2>$null
    if ($nodeVersion -and $LASTEXITCODE -eq 0) {
        Write-Log -Message "Node.js instalado: $nodeVersion" -Type 'Success'
    }
    else {
        Write-Log -Message 'Node.js no está instalado. Descarga en https://nodejs.org' -Type 'Error'
        return $false
    }

    $npmVersion = & npm --version 2>$null
    if ($npmVersion -and $LASTEXITCODE -eq 0) {
        Write-Log -Message "npm instalado: v$npmVersion" -Type 'Success'
    }
    else {
        Write-Log -Message 'npm no está instalado' -Type 'Error'
        return $false
    }

    if (Test-Path -Path '.env') {
        Write-Log -Message 'Archivo .env encontrado' -Type 'Success'
    }
    else {
        if (Test-Path -Path '.env.example') {
            Write-Log -Message 'Creando .env desde .env.example...' -Type 'Warning'
            Copy-Item -Path '.env.example' -Destination '.env'
            Write-Log -Message 'Por favor, edita el archivo .env con tus configuraciones' -Type 'Warning'
        }
        else {
            Write-Log -Message 'No se encontró .env.example' -Type 'Error'
            return $false
        }
    }

    return $true
}

function Install-Dependencies {
    [CmdletBinding()]
    [OutputType([bool])]
    param()

    Write-Log -Message 'Instalando dependencias...' -Type 'Info'

    Write-Log -Message 'Instalando dependencias del backend...' -Type 'Info'
    & npm install 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Log -Message 'Error instalando dependencias del backend' -Type 'Error'
        return $false
    }
    Write-Log -Message 'Dependencias del backend instaladas' -Type 'Success'

    Write-Log -Message 'Instalando dependencias del frontend...' -Type 'Info'
    Push-Location -Path 'client'
    & npm install 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE
    Pop-Location

    if ($exitCode -ne 0) {
        Write-Log -Message 'Error instalando dependencias del frontend' -Type 'Error'
        return $false
    }
    Write-Log -Message 'Dependencias del frontend instaladas' -Type 'Success'

    return $true
}

function Start-Services {
    [CmdletBinding()]
    [OutputType([bool])]
    param()

    Write-Log -Message 'Iniciando servicios...' -Type 'Info'

    Stop-Services -Silent

    Write-Log -Message 'Iniciando backend en puerto 3001...' -Type 'Info'
    $backendProcess = Start-Process -FilePath 'node' -ArgumentList 'server/index.js' -NoNewWindow -PassThru
    Start-Sleep -Seconds 3

    try {
        Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop | Out-Null
        Write-Log -Message "Backend iniciado correctamente (PID: $($backendProcess.Id))" -Type 'Success'
    }
    catch {
        Write-Log -Message 'Backend no responde. Verificando logs...' -Type 'Warning'
    }

    Write-Log -Message 'Iniciando frontend en puerto 3000...' -Type 'Info'
    Push-Location -Path 'client'
    $frontendProcess = Start-Process -FilePath 'npm' -ArgumentList 'start' -NoNewWindow -PassThru
    Pop-Location

    Start-Sleep -Seconds 5
    Write-Log -Message "Frontend iniciado (PID: $($frontendProcess.Id))" -Type 'Success'

    return $true
}

function Stop-Services {
    [CmdletBinding()]
    param(
        [Parameter()]
        [switch]$Silent
    )

    if (-not $Silent) {
        Write-Log -Message 'Deteniendo servicios...' -Type 'Info'
    }

    Get-Process -Name 'node' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2

    if (-not $Silent) {
        Write-Log -Message 'Servicios detenidos' -Type 'Success'
    }
}

function Get-Status {
    [CmdletBinding()]
    param()

    Write-Log -Message 'Verificando estado de los servicios...' -Type 'Info'
    Write-Host ''

    try {
        Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop | Out-Null
        Write-Log -Message 'Backend API: ACTIVO (http://localhost:3001)' -Type 'Success'
    }
    catch {
        Write-Log -Message 'Backend API: INACTIVO' -Type 'Error'
    }

    try {
        Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop | Out-Null
        Write-Log -Message 'Frontend: ACTIVO (http://localhost:3000)' -Type 'Success'
    }
    catch {
        Write-Log -Message 'Frontend: INACTIVO' -Type 'Error'
    }

    try {
        Invoke-WebRequest -Uri 'http://localhost:3001/api/docs' -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop | Out-Null
        Write-Log -Message 'API Docs: ACTIVO (http://localhost:3001/api/docs)' -Type 'Success'
    }
    catch {
        Write-Log -Message 'API Docs: INACTIVO' -Type 'Warning'
    }

    Write-Host ''

    $processes = @(Get-Process -Name 'node' -ErrorAction SilentlyContinue)
    if ($processes.Count -gt 0) {
        Write-Host 'Procesos Node.js activos:' -ForegroundColor $script:Colors.Info
        foreach ($proc in $processes) {
            $memoryMB = [math]::Round($proc.WorkingSet64 / 1MB, 2)
            Write-Host "  PID: $($proc.Id) - Memoria: $memoryMB MB"
        }
    }
}

function Invoke-Build {
    [CmdletBinding()]
    [OutputType([bool])]
    param()

    Write-Log -Message 'Construyendo versión de producción...' -Type 'Info'

    Write-Log -Message 'Compilando frontend React...' -Type 'Info'
    Push-Location -Path 'client'
    & npm run build 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE
    Pop-Location

    if ($exitCode -ne 0) {
        Write-Log -Message 'Error en el build del frontend' -Type 'Error'
        return $false
    }

    Write-Log -Message 'Build de producción completado' -Type 'Success'
    Write-Log -Message 'Los archivos están en: client/build/' -Type 'Info'

    return $true
}

function Invoke-Tests {
    [CmdletBinding()]
    param()

    Write-Log -Message 'Ejecutando tests...' -Type 'Info'

    Write-Log -Message 'Probando endpoints de la API...' -Type 'Info'

    $endpoints = @(
        @{Url = 'http://localhost:3001/api/health'; Name = 'Health Check'},
        @{Url = 'http://localhost:3001/api/docs/json'; Name = 'OpenAPI Spec'}
    )

    foreach ($endpoint in $endpoints) {
        try {
            Invoke-WebRequest -Uri $endpoint.Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop | Out-Null
            Write-Log -Message "$($endpoint.Name): OK" -Type 'Success'
        }
        catch {
            Write-Log -Message "$($endpoint.Name): FALLO" -Type 'Error'
        }
    }

    Write-Log -Message 'Probando autenticación...' -Type 'Info'
    try {
        $body = @{username = 'admin'; password = 'admin123'} | ConvertTo-Json
        $loginResponse = Invoke-WebRequest -Uri 'http://localhost:3001/api/auth/login' -Method Post -Body $body -ContentType 'application/json' -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        $data = $loginResponse.Content | ConvertFrom-Json
        if ($data.success -and $data.usuario) {
            Write-Log -Message "Login: OK - Usuario: $($data.usuario.nombre_completo)" -Type 'Success'
        }
        else {
            Write-Log -Message 'Login: FALLO' -Type 'Error'
        }
    }
    catch {
        Write-Log -Message "Login: ERROR - $($_.Exception.Message)" -Type 'Error'
    }
}

function Clear-Cache {
    [CmdletBinding()]
    param()

    Write-Log -Message 'Limpiando cache y archivos temporales...' -Type 'Info'

    $confirm = Read-Host -Prompt 'Eliminar node_modules? (s/N)'
    if ($confirm -eq 's' -or $confirm -eq 'S') {
        Remove-Item -Path 'node_modules' -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item -Path 'client/node_modules' -Recurse -Force -ErrorAction SilentlyContinue
        Write-Log -Message 'node_modules eliminados' -Type 'Success'
    }

    Remove-Item -Path 'server/logs/*' -Force -ErrorAction SilentlyContinue
    Remove-Item -Path '*.log' -Force -ErrorAction SilentlyContinue
    Write-Log -Message 'Logs limpiados' -Type 'Success'

    Remove-Item -Path 'client/build' -Recurse -Force -ErrorAction SilentlyContinue
    Write-Log -Message 'Build anterior eliminado' -Type 'Success'
}

function Backup-Database {
    [CmdletBinding()]
    param()

    Write-Log -Message 'Creando backup de la base de datos...' -Type 'Info'

    $backupDir = 'backups'
    if (-not (Test-Path -Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir -ErrorAction SilentlyContinue | Out-Null
    }

    $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $backupFile = Join-Path -Path $backupDir -ChildPath "backup_$timestamp.json"

    Copy-Item -Path 'server/database/database.json' -Destination $backupFile

    Compress-Archive -Path $backupFile -DestinationPath "$backupFile.zip" -Force
    Remove-Item -Path $backupFile -Force

    Write-Log -Message "Backup creado: $backupFile.zip" -Type 'Success'
}

function Show-Help {
    [CmdletBinding()]
    param()

    Write-Host 'Uso: .\deploy.ps1 <comando>' -ForegroundColor $script:Colors.Info
    Write-Host ''
    Write-Host 'Comandos disponibles:'
    Write-Host '  start       - Iniciar backend y frontend'
    Write-Host '  stop        - Detener todos los servicios'
    Write-Host '  restart     - Reiniciar servicios'
    Write-Host '  status      - Ver estado de los servicios'
    Write-Host '  install     - Instalar dependencias'
    Write-Host '  build       - Construir versión de producción'
    Write-Host '  test        - Ejecutar tests'
    Write-Host '  backup      - Crear backup de la base de datos'
    Write-Host '  clean       - Limpiar cache y temporales'
    Write-Host '  help        - Mostrar esta ayuda'
    Write-Host ''
    Write-Host 'Ejemplos:'
    Write-Host '  .\deploy.ps1 start    # Iniciar aplicación'
    Write-Host '  .\deploy.ps1 status   # Ver estado'
}

Write-Title

switch ($Command) {
    'start' {
        if (Test-Requirements) {
            $null = Start-Services
            Get-Status
            Write-Host ''
            Write-Log -Message 'Aplicación iniciada. Abre http://localhost:3000 en tu navegador' -Type 'Success'
        }
    }
    'stop' {
        Stop-Services
    }
    'restart' {
        Stop-Services
        $null = Start-Services
        Get-Status
    }
    'status' {
        Get-Status
    }
    'install' {
        if (Test-Requirements) {
            $null = Install-Dependencies
        }
    }
    'build' {
        $null = Invoke-Build
    }
    'test' {
        Invoke-Tests
    }
    'backup' {
        Backup-Database
    }
    'clean' {
        Clear-Cache
    }
    'check' {
        $null = Test-Requirements
    }
    default {
        Show-Help
    }
}
