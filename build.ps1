param(
  [string]$OutputDirectory = "dist",
  # Public site URL (e.g. https://josephclyde.dev). Defaults to publicSiteUrl in supabase-config.js.
  [string]$SiteUrl = ""
)

# Kept for convenience on Windows. The build itself lives in scripts/build.mjs so Vercel and other hosts run the same steps.
$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$buildArgs = @("--out=$OutputDirectory")
if ($SiteUrl) { $buildArgs += "--site-url=$SiteUrl" }

node (Join-Path $projectRoot "scripts/check.mjs")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node (Join-Path $projectRoot "scripts/build.mjs") @buildArgs
exit $LASTEXITCODE
