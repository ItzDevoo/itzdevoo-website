# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copy package files for dependency installation
# COPY package*.json ./
# RUN npm ci --only=production --no-audit --no-fund

# Copy source files
COPY . .

# Remove development files and optimize for production
RUN rm -rf \
    .git \
    .github \
    .kiro \
    node_modules \
    *.md \
    .gitignore \
    Dockerfile \
    docker-compose.yml \
    build.ps1

# Production stage
FROM nginx:alpine

# Install security updates and required packages
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

# Set timezone
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create non-root user for security
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-user -g nginx-user nginx-user

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy website files from builder stage
COPY --from=builder /app /usr/share/nginx/html

# Create necessary directories with proper permissions
RUN mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/cache/nginx/proxy_temp && \
    mkdir -p /var/cache/nginx/fastcgi_temp && \
    mkdir -p /var/cache/nginx/uwsgi_temp && \
    mkdir -p /var/cache/nginx/scgi_temp && \
    mkdir -p /var/log/nginx && \
    mkdir -p /tmp && \
    mkdir -p /run/nginx && \
    chmod -R 755 /var/cache/nginx && \
    chmod -R 755 /tmp && \
    chmod -R 755 /run/nginx && \
    chmod -R 644 /usr/share/nginx/html && \
    find /usr/share/nginx/html -type d -exec chmod 755 {} \; && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /tmp && \
    chown -R nginx-user:nginx-user /run/nginx && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html

# Security: Remove unnecessary packages and files
RUN rm -rf /var/cache/apk/* && \
    rm -rf /tmp/* && \
    find /usr/share/nginx/html -name "*.map" -delete

# Note: We need to run as root for nginx to work properly
# The nginx process will drop privileges internally

# Expose port
EXPOSE 8080

# Add labels for better container management
LABEL maintainer="ItzDevoo <contact@itzdevoo.com>" \
      version="1.0.0" \
      description="ItzDevoo Professional Portfolio Website" \
      org.opencontainers.image.title="ItzDevoo Portfolio" \
      org.opencontainers.image.description="Professional portfolio website with Docker deployment" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.created="2025-07-19" \
      org.opencontainers.image.source="https://github.com/ItzDevoo/itzdevoo-website" \
      org.opencontainers.image.licenses="Private"

# Health check with improved monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start nginx with proper signal handling
STOPSIGNAL SIGQUIT
CMD ["nginx", "-g", "daemon off;"]