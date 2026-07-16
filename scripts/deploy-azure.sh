#!/usr/bin/env bash
# Deploy Melody Islands to Azure App Service
# Prerequisites: Azure CLI (az), logged in (az login)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

APP_NAME="${APP_NAME:-melody-islands-$(whoami | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9' | cut -c1-12)}"
RG="${RESOURCE_GROUP:-melody-islands-rg}"
LOC="${LOCATION:-eastus}"
SKU="${SKU:-B1}"

echo "==> App name: $APP_NAME"
echo "==> Resource group: $RG ($LOC)"

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI not found. Install: https://learn.microsoft.com/cli/azure/install-azure-cli"
  echo "Or: brew install azure-cli"
  exit 1
fi

echo "==> Ensuring login…"
az account show >/dev/null 2>&1 || az login

echo "==> Creating resource group…"
az group create --name "$RG" --location "$LOC" --output none

echo "==> Deploying infrastructure (Bicep)…"
az deployment group create \
  --resource-group "$RG" \
  --template-file infra/main.bicep \
  --parameters appName="$APP_NAME" skuName="$SKU" \
  --output none

echo "==> Building Next.js standalone…"
npm ci
npm run build

echo "==> Preparing deploy package…"
STAGE=$(mktemp -d)
if [ -d .next/standalone ]; then
  cp -R .next/standalone/. "$STAGE/"
  mkdir -p "$STAGE/.next"
  cp -R .next/static "$STAGE/.next/static"
  cp -R public "$STAGE/public"
else
  echo "Standalone output missing — enable output: 'standalone' in next.config"
  exit 1
fi

echo "==> Deploying zip to App Service…"
(
  cd "$STAGE"
  zip -r "$ROOT/deploy.zip" . >/dev/null
)
az webapp deploy \
  --resource-group "$RG" \
  --name "$APP_NAME" \
  --src-path "$ROOT/deploy.zip" \
  --type zip \
  --async false

URL=$(az webapp show -g "$RG" -n "$APP_NAME" --query defaultHostName -o tsv)
echo ""
echo "✅ Deployed: https://$URL"
echo "   Health:   https://$URL/api/health"
rm -f "$ROOT/deploy.zip"
