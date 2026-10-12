#!/usr/bin/env bash
set -euo pipefail

docker info >/dev/null
npx supabase migration list --local
npx supabase test db
