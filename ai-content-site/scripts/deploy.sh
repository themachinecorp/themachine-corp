#!/bin/bash
# AI Content Site Deployment Script - GitHub Push Mode
# No local CLI authentication required - uses GitHub Actions auto-deploy

set -e

echo "🚀 AI Content Site Deployment Script"
echo "======================================"
echo "Mode: GitHub Push Auto-Deploy"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SITE_DIR="website"
OUTPUT_DIR="website/public"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed"
        exit 1
    fi
    
    # Check if inside git repo
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        exit 1
    fi
    
    log_info "All prerequisites met ✓"
}

# Generate new AI content
generate_content() {
    log_step "Generating new AI content..."
    
    read -p "Generate new articles? (y/n): " generate
    
    if [ "$generate" = "y" ] || [ "$generate" = "Y" ]; then
        if [ -z "$AI_API_KEY" ]; then
            log_warn "AI_API_KEY not set. Skipping AI content generation."
        else
            cd scripts
            node content-generator.js
            cd ..
            log_info "Content generated ✓"
        fi
    fi
}

# Build site locally (optional - GitHub Actions will also build)
build_site() {
    log_step "Building site locally..."
    
    cd $SITE_DIR
    npm install
    npm run build
    cd ..
    
    log_info "Site built successfully ✓"
}

# Generate sitemap
generate_sitemap() {
    log_step "Generating sitemap..."
    
    cat > $OUTPUT_DIR/sitemap.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://ai-tech-hub.example.com/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://ai-tech-hub.example.com/about/</loc>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
</urlset>
EOF
    
    log_info "Sitemap generated ✓"
}

# Deploy to GitHub - triggers automatic deployment
deploy_github() {
    log_step "Deploying to GitHub (triggers auto-deploy)..."
    
    # Get current branch
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    log_info "Current branch: $BRANCH"
    
    # Add all changes
    git add -A
    
    # Create commit message
    COMMIT_MSG="deploy: AI content site update $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Commit
    log_info "Committing changes..."
    git commit -m "$COMMIT_MSG" || log_warn "No changes to commit"
    
    # Push to trigger GitHub Actions
    log_info "Pushing to GitHub (this will trigger auto-deploy)..."
    git push origin $BRANCH
    
    log_info "✓ Code pushed to GitHub!"
    log_info "✓ GitHub Actions will auto-deploy to Vercel"
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}Deployment Triggered!${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Check GitHub Actions tab for build status"
    echo "2. Vercel will auto-deploy from main branch"
    echo "3. Visit: https://vercel.com/dashboard"
}

# Show deployment status
status() {
    echo "================================"
    echo "Project Status"
    echo "================================"
    
    echo -e "\n📁 Site Structure:"
    ls -la $SITE_DIR/source/_posts/ 2>/dev/null | wc -l | xargs echo "   Articles:"
    
    echo -e "\n🌐 Build Output:"
    if [ -d "$OUTPUT_DIR" ]; then
        echo "   Status: Built ✓"
        find $OUTPUT_DIR -type f | wc -l | xargs echo "   Files:"
    else
        echo "   Status: Not built ✗"
    fi
    
    echo -e "\n🔗 Deployment Links:"
    echo "   GitHub: https://github.com/themachinehf/openclaw-workspace"
    echo "   Vercel: https://vercel.com/dashboard"
}

# Show usage
usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  build       Build site locally"
    echo "  deploy      Deploy to GitHub (triggers auto-deploy)"
    echo "  generate    Generate AI content"
    echo "  status      Show project status"
    echo "  all         Generate content, build, and deploy"
    echo "  help        Show this help"
    echo ""
    echo "Environment Variables:"
    echo "  AI_API_KEY      - OpenAI API key for content generation"
    echo ""
    echo "How it works:"
    echo "  1. Run 'deploy' to push code to GitHub"
    echo "  2. GitHub Actions automatically builds"
    echo "  3. Vercel auto-deploys from main branch"
    echo "  4. No local CLI authentication needed!"
}

# Main script
case "${1:-help}" in
    build)
        check_prerequisites
        build_site
        generate_sitemap
        ;;
    deploy)
        check_prerequisites
        deploy_github
        ;;
    generate)
        generate_content
        ;;
    all)
        check_prerequisites
        generate_content
        build_site
        generate_sitemap
        deploy_github
        ;;
    status)
        status
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        log_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac

echo ""
log_info "Done!"
