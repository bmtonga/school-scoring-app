$ErrorActionPreference = 'Stop'

npx supabase test db
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
