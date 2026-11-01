# Azure Free hosting

Production: https://mango-ocean-02eb9e810.4.azurestaticapps.net/

GitHub Pages remains available at https://alharith1.github.io/rakeeza/online2/ . The original root demo is unchanged.

Azure resource: `rakeeza`, resource group `rakeeza-free`, Static Web Apps **Free** SKU. No Azure Functions, Front Door, paid plan or custom domain was enabled. The client connects directly to the existing Supabase backend.

The public repository workflow `.github/workflows/azure-free.yml` deploys the prebuilt `online2/` folder on relevant main pushes or manual runs. Its deployment token is held in the repository Actions secret `RAKEEZA_AZURE_DEPLOY_TOKEN`, never in source.

Build the connected application with `cd source && npm ci && npx vite build --config vite.v2.config.ts`, then copy `dist-v2/` contents to `online2/`, naming `v2.html` as `index.html`. Preserve `online2/staticwebapp.config.json`. Updating source alone does not publish a new bundle.

## Limits

The Free plan has no SLA and stops serving when its bandwidth quota is exceeded, rather than charging overage. The Azure subscription was a Free Trial with spending limit On when published on November 1, 2026. Trial expiry or exhausted credit can disable the subscription even though this resource's SKU is Free. No subscription upgrade is authorized. GitHub Pages stays as a fallback.

Pricing: https://azure.microsoft.com/en-us/pricing/details/app-service/static/
Trial behavior: https://learn.microsoft.com/en-us/azure/cost-management-billing/manage/avoid-charges-free-account

## Verification on November 1, 2026

Live desktop/mobile introduction rendered without horizontal overflow. Actual company registration and second-browser login succeeded against Supabase from the Azure origin. Refresh showed the introduction and the login button resumed the saved valid session. Employee attendance entry routes to employee login. No JavaScript errors were observed. Test account/company/session data were removed.
