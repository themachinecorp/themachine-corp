# GitHub Secrets Setup

To enable CI/CD deployment, add this secret in GitHub:

1. Go to: https://github.com/themachinehf/themachine-workspace/settings/secrets/actions/new
2. Name: `CLOUDFLARE_API_TOKEN`
3. Value: Your Cloudflare API Token

Get token from: https://dash.cloudflare.com/profile/api-tokens
- Use "Edit token" or create new "Custom token"
- Permissions needed: Cloudflare Pages (Read, Write)
