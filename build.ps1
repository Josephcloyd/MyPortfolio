param(
  [string]$OutputDirectory = "dist",
  # Public site URL (e.g. https://josephclyde.dev). Defaults to publicSiteUrl in supabase-config.js.
  [string]$SiteUrl = ""
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputPath = Join-Path $projectRoot $OutputDirectory
$publicFiles = @(
  "index.html", "admin.html", "project.html", "resume.html", "privacy.html", "security.html", "404.html",
  "styles.css", "admin.css", "favicon.svg", "og.png", "manifest.json", "_headers", "robots.txt", "vercel.json",
  "theme-init.js", "content.js", "brand-icons.js", "icons.js", "site.js", "home.js", "project-view.js", "resume.js", "contact.js",
  "supabase-config.js", "security.js", "portfolio-data.js"
)
$publicDirectories = @("fonts", "images", ".well-known")
$optionalPatterns = @("*.pdf")

if (Test-Path -LiteralPath $outputPath) { Remove-Item -LiteralPath $outputPath -Recurse -Force }
New-Item -ItemType Directory -Path $outputPath | Out-Null

foreach ($file in $publicFiles) {
  $source = Join-Path $projectRoot $file
  if (-not (Test-Path -LiteralPath $source)) { throw "Missing public file: $file" }
  Copy-Item -LiteralPath $source -Destination (Join-Path $outputPath $file)
}
foreach ($directory in $publicDirectories) {
  $source = Join-Path $projectRoot $directory
  if (Test-Path -LiteralPath $source) { Copy-Item -LiteralPath $source -Destination (Join-Path $outputPath $directory) -Recurse }
}
foreach ($pattern in $optionalPatterns) {
  Get-ChildItem -Path $projectRoot -Filter $pattern -File | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $outputPath }
}

# SEO: canonical URLs, absolute Open Graph URLs, sitemap, and robots sitemap pointer.
if (-not $SiteUrl) {
  $config = Get-Content -LiteralPath (Join-Path $projectRoot "supabase-config.js") -Raw
  if ($config -match 'publicSiteUrl:\s*"([^"]*)"') { $SiteUrl = $Matches[1] }
}
$SiteUrl = $SiteUrl.TrimEnd("/")

if ($SiteUrl) {
  $pages = @{ "index.html" = "/"; "resume.html" = "/resume.html"; "privacy.html" = "/privacy.html"; "security.html" = "/security.html" }
  foreach ($page in $pages.Keys) {
    $path = Join-Path $outputPath $page
    $html = [IO.File]::ReadAllText($path)
    $url = "$SiteUrl$($pages[$page])"
    $tags = "<link rel=`"canonical`" href=`"$url`" />`n    <meta property=`"og:url`" content=`"$url`" />"
    $html = $html.Replace('<meta name="theme-color"', "$tags`n    <meta name=`"theme-color`"")
    $html = $html.Replace('content="og.png"', "content=`"$SiteUrl/og.png`"")
    [IO.File]::WriteAllText($path, $html, (New-Object Text.UTF8Encoding $false))
  }

  $projectIds = [regex]::Matches((Get-Content -LiteralPath (Join-Path $projectRoot "content.js") -Raw), 'id:\s*"(project-[a-z0-9-]+)"') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
  $today = Get-Date -Format "yyyy-MM-dd"
  $entries = @("/", "/resume.html") + ($projectIds | ForEach-Object { "/project.html?id=$_" })
  $xml = @('<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
  foreach ($entry in $entries) { $xml += "  <url><loc>$([Security.SecurityElement]::Escape("$SiteUrl$entry"))</loc><lastmod>$today</lastmod></url>" }
  $xml += '</urlset>'
  [IO.File]::WriteAllLines((Join-Path $outputPath "sitemap.xml"), $xml, (New-Object Text.UTF8Encoding $false))
  Add-Content -LiteralPath (Join-Path $outputPath "robots.txt") -Value "`nSitemap: $SiteUrl/sitemap.xml"
  Write-Host "SEO: canonical tags and sitemap.xml generated for $SiteUrl"
} else {
  Write-Warning "No public site URL set. Add publicSiteUrl in supabase-config.js (or pass -SiteUrl) to generate canonical tags and sitemap.xml."
}

Write-Host "Secure deployment package created at $outputPath"
