# PowerShell Script to Update AWS Amplify Environment Variables from .env.local
# Usage: .\scripts\update-amplify-env.ps1

param (
    [string]$EnvFilePath = ".env.local"
)

# Check if file exists
if (-not (Test-Path $EnvFilePath)) {
    Write-Error "File $EnvFilePath not found."
    exit 1
}

Write-Host "Reading $EnvFilePath (v2 check)..."

# Read and parse .env file
$envParams = @()
$AppId = $null

# Use -Raw to read the whole file to handle LF/CRLF correctly, then split
try {
    # Force UTF8 encoding
    $content = Get-Content $EnvFilePath -Encoding UTF8 -Raw
    
    if ($null -ne $content) {
        # Handles both CRLF (\r\n) and LF (\n)
        $lines = $content -split "\r?\n"
    } else {
        $lines = @()
    }
} catch {
    Write-Error "Failed to read $EnvFilePath. $_"
    exit 1
}

foreach ($rawLine in $lines) {
    if ([string]::IsNullOrWhiteSpace($rawLine)) { continue }
    
    $line = $rawLine.Trim()
    
    # Skip comments
    if ($line.StartsWith("#")) { continue }

    # Split by first '=' only
    $parts = $line -split '=', 2
    if ($parts.Length -eq 2) {
        $key = $parts[0].Trim()
        $value = $parts[1].Trim()
        
        # Remove quotes if present
        if ($value.StartsWith('"') -and $value.EndsWith('"')) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        elseif ($value.StartsWith("'") -and $value.EndsWith("'")) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        if ($key -eq "AMPLIFY_ID") {
            $AppId = $value
        }

        # Add to params list formatted for AWS CLI (Key=Value)
        $envParams += "$key=$value"
    }
}

if ([string]::IsNullOrEmpty($AppId)) {
    Write-Error "AMPLIFY_ID not found in $EnvFilePath. Please ensure it is set (e.g., AMPLIFY_ID=xxxxx)."
    exit 1
}

if ($envParams.Count -eq 0) {
    Write-Warning "No variables found in $EnvFilePath"
    exit
}

$envString = $envParams -join ","

Write-Host "Updating Amplify App ($AppId) with variables..."

try {
    # Execute AWS CLI and capture output
    $jsonOutput = aws amplify update-app --app-id $AppId --environment-variables $envString | Out-String | ConvertFrom-Json
    
    Write-Host "Success! Environment variables updated." -ForegroundColor Green
    Write-Host "Updated Variables:"
    
    # Output only the environmentVariables part
    $jsonOutput.app.environmentVariables | ConvertTo-Json -Depth 5
} catch {
    Write-Error "An error occurred. Make sure AWS CLI is installed and configured."
    Write-Error $_
}
