param(
  [string]$OutputDirectory = "dist"
)

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputPath = Join-Path $projectRoot $OutputDirectory
$publicFiles = @(
  "index.html", "admin.html", "project.html", "resume.html", "privacy.html", "security.html", "404.html",
  "styles.css", "supabase-config.js", "security.js", "portfolio-data.js", "portfolio-view.js", "project-view.js",
  "resume.js", "contact.js", "site.js", "manifest.json", "og.png", "_headers", "robots.txt", "vercel.json"
)

if (Test-Path -LiteralPath $outputPath) { Remove-Item -LiteralPath $outputPath -Recurse -Force }
New-Item -ItemType Directory -Path $outputPath | Out-Null
foreach ($file in $publicFiles) { Copy-Item -LiteralPath (Join-Path $projectRoot $file) -Destination (Join-Path $outputPath $file) }
New-Item -ItemType Directory -Path (Join-Path $outputPath ".well-known") | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot ".well-known\security.txt") -Destination (Join-Path $outputPath ".well-known\security.txt")
Write-Host "Secure deployment package created at $outputPath"
