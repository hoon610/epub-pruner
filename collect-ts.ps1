#Run powershell -ExecutionPolicy Bypass -File .\collect-ts.ps1 

$currentDir = Get-Location
$outputFile = "typescript-paths-and-code.txt"

# Make sure we're not trying to write to a locked file
if (Test-Path $outputFile) {
    Remove-Item $outputFile -Force
}

# Create a string builder to store all content
$content = [System.Text.StringBuilder]::new()
[void]$content.AppendLine("Working Directory: $currentDir")
[void]$content.AppendLine("")

# Define all file types to collect
$configFiles = @(
    "package.json",
    "tsconfig.json",
    ".eslintrc.json"
)

# First collect and write config files
foreach ($file in $configFiles) {
    $filePath = Join-Path $currentDir $file
    if (Test-Path $filePath) {
        [void]$content.AppendLine("File: $filePath")
        [void]$content.AppendLine("----------------------------------------")
        [void]$content.AppendLine((Get-Content $filePath -Raw))
        [void]$content.AppendLine("`n")
    }
}

# Then collect TypeScript files and their contents
Get-ChildItem -Path .\src -Recurse -Include *.ts,*.tsx | 
ForEach-Object {
    [void]$content.AppendLine("File: $($_.FullName)")
    [void]$content.AppendLine("----------------------------------------")
    [void]$content.AppendLine((Get-Content $_.FullName -Raw))
    [void]$content.AppendLine("`n")
}

# Write everything at once
Set-Content -Path $outputFile -Value $content.ToString()

Write-Host "Configuration files and TypeScript files have been collected in $outputFile"
pause