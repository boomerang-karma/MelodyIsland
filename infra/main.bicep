// Melody Islands — Azure infrastructure (App Service + free-tier friendly plan)
// Deploy: az deployment group create -g <rg> -f infra/main.bicep -p appName=<name>

@description('Globally unique Web App name')
param appName string

@description('Azure region')
param location string = resourceGroup().location

@description('App Service plan SKU')
@allowed(['F1', 'B1', 'S1', 'P1v3'])
param skuName string = 'B1'

@description('Node version on Linux App Service')
param nodeVersion string = '20-lts'

var planName = '${appName}-plan'
var webAppName = appName

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: location
  sku: {
    name: skuName
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource web 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|${nodeVersion}'
      appCommandLine: 'node server.js'
      alwaysOn: skuName != 'F1'
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        {
          name: 'PROGRESS_BACKEND'
          value: 'memory'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
      ]
    }
  }
}

output webAppName string = web.name
output defaultHostName string = web.properties.defaultHostName
output webAppUrl string = 'https://${web.properties.defaultHostName}'
