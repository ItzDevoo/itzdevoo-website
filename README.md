# ItzDevoo Portfolio

A professional portfolio website built with modern web technologies and containerized with Docker.

## Features

- 🎨 Modern, responsive design
- 🚀 Optimized performance
- 🔒 Security best practices
- 📱 Mobile-first approach
- 🐳 Docker containerization
- ☁️ Cloudflare tunnel integration

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Web Server**: Nginx
- **Containerization**: Docker
- **Deployment**: Cloudflare Tunnel

## Development

### Local Development

1. Clone the repository
2. Open `index.html` in your browser for development
3. Make changes to HTML, CSS, and JavaScript files

### Docker Development

```bash
# Build the Docker image
docker build -t itzdevoo-portfolio .

# Run the container
docker run -p 8080:8080 itzdevoo-portfolio
```

### Production Deployment

The site is designed to be deployed locally using Docker with public access through Cloudflare tunnels.

## Project Structure

```
├── index.html              # Main HTML file
├── styles/                 # CSS files
│   ├── main.css           # Main stylesheet
│   ├── base/              # Base styles
│   ├── components/        # Component styles
│   └── layout/            # Layout utilities
├── scripts/               # JavaScript files
│   ├── main.js           # Main JS entry point
│   ├── utils/            # Utility functions
│   └── components/       # Component scripts
├── Dockerfile            # Docker configuration
├── nginx.conf           # Nginx configuration
└── README.md           # This file
```

## License

Private project - All rights reserved.