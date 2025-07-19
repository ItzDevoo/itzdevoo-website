# ItzDevoo Portfolio

A professional portfolio website built with modern web technologies and containerized with Docker. Deployed locally with public access through Cloudflare tunnels.

## 🌟 Features

- 🎨 Modern, responsive design with smooth animations
- 🚀 Optimized performance and Core Web Vitals
- 🔒 Security best practices and HTTPS enforcement
- 📱 Mobile-first responsive approach
- ♿ WCAG accessibility compliance
- 🐳 Docker containerization with Nginx
- ☁️ Cloudflare tunnel integration
- 🎯 Professional branding (Black & Lime Green theme)

## 🛠 Technology Stack

- **Frontend**: HTML5, CSS3 (Grid/Flexbox), Vanilla JavaScript (ES6+)
- **Web Server**: Nginx (Alpine Linux)
- **Containerization**: Docker with multi-stage builds
- **Deployment**: Local Docker + Cloudflare Tunnel
- **Domain**: itzdevoo.com
- **Version Control**: Git with GitHub (multi-branch strategy)

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Local Development

```powershell
# Clone the repository
git clone <repository-url>
cd itzdevoo-website

# Switch to development branch
git checkout development

# Build and run with Docker Compose
.\build.ps1

# Or manually:
docker-compose up -d
```

The site will be available at `http://localhost:8080`

### Development Workflow

This project uses a **three-branch strategy**:

- **`main`** - Stable release branch
- **`development`** - Active development branch
- **`live`** - Production deployment branch

#### Branch Workflow:

1. **Development Work**:
   ```powershell
   git checkout development
   # Make your changes
   git add .
   git commit -m "Your changes"
   git push origin development
   ```

2. **Testing & Staging**:
   ```powershell
   # Test your changes locally
   .\build.ps1
   # Verify everything works correctly
   ```

3. **Release to Production**:
   ```powershell
   # Merge development to main
   git checkout main
   git merge development
   git push origin main
   
   # Deploy to live
   git checkout live
   git merge main
   git push origin live
   ```

## 🐳 Docker Commands

```powershell
# Build the image
docker build -t itzdevoo-portfolio .

# Run container
docker run -p 8080:8080 itzdevoo-portfolio

# Using Docker Compose (recommended)
docker-compose up -d          # Start in background
docker-compose logs -f        # View logs
docker-compose down           # Stop and remove
```

## 🌐 Deployment

### Cloudflare Tunnel Setup

The site is designed to be accessed publicly through Cloudflare tunnels:

1. **Local Docker Container** runs on port 8080
2. **Cloudflare Tunnel** routes itzdevoo.com to local container
3. **HTTPS** automatically handled by Cloudflare

### Production Deployment

```powershell
# Switch to live branch
git checkout live

# Build and deploy
.\build.ps1

# Configure Cloudflare tunnel to point to localhost:8080
```

## 📁 Project Structure

```
itzdevoo-website/
├── 📄 index.html              # Main HTML file
├── 🎨 styles/                 # CSS architecture
│   ├── main.css              # Main stylesheet (imports all)
│   ├── base/                 # Foundation styles
│   │   ├── variables.css     # CSS custom properties
│   │   ├── reset.css         # CSS reset/normalize
│   │   └── typography.css    # Typography system
│   ├── layout/               # Layout utilities
│   │   ├── grid.css          # Grid/Flexbox system
│   │   └── responsive.css    # Responsive utilities
│   └── components/           # Component styles
│       ├── header.css        # Header component
│       ├── hero.css          # Hero section
│       ├── about.css         # About section
│       └── footer.css        # Footer component
├── ⚡ scripts/                # JavaScript modules
│   ├── main.js               # Main entry point
│   ├── utils/                # Utility functions
│   │   ├── animations.js     # Animation utilities
│   │   └── responsive.js     # Responsive helpers
│   └── components/           # Component scripts
│       ├── navigation.js     # Navigation interactions
│       └── smooth-scroll.js  # Smooth scrolling
├── 🐳 Docker files
│   ├── Dockerfile            # Multi-stage Docker build
│   ├── docker-compose.yml    # Docker Compose config
│   └── nginx.conf            # Nginx configuration
├── 🔧 Configuration
│   ├── .gitignore            # Git ignore rules
│   ├── build.ps1             # Build script
│   └── README.md             # This file
└── 📋 .kiro/specs/           # Project specifications
    └── personal-portfolio-site/
        ├── requirements.md   # Project requirements
        ├── design.md         # Design document
        └── tasks.md          # Implementation tasks
```

## 🎨 Design System

### Color Palette
- **Primary**: Black (#000000)
- **Secondary**: Lime Green (#32cd32)
- **Background**: White (#ffffff)
- **Text**: Dark Gray (#333333)

### Typography
- **Font Stack**: System fonts (SF Pro, Segoe UI, Roboto)
- **Responsive**: Clamp-based fluid typography
- **Weights**: 300, 400, 500, 600, 700, 800

### Responsive Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: 1024px - 1280px
- **Large**: > 1280px

## ✅ Features Implemented

- [x] Semantic HTML5 structure
- [x] Responsive CSS Grid/Flexbox layout
- [x] Smooth animations and transitions
- [x] Sticky navigation header
- [x] Professional hero section
- [x] Card-based about section
- [x] Contact footer with social links
- [x] Mobile-first responsive design
- [x] WCAG accessibility compliance
- [x] Docker containerization
- [x] Nginx web server optimization
- [x] Multi-branch Git workflow

## 🔄 Development Status

Currently implementing JavaScript functionality and performance optimizations. See `.kiro/specs/personal-portfolio-site/tasks.md` for detailed progress.

## 📞 Contact

- **Email**: contact@itzdevoo.com
- **Website**: https://itzdevoo.com
- **GitHub**: https://github.com/itzdevoo

## 📄 License

Private project - All rights reserved.