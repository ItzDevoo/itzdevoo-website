# Git-based deployment from GitHub live branch
FROM nginx:alpine

# Install git and required packages
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
    git \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

# Set timezone
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Set build arguments
ARG GITHUB_REPO=https://github.com/ItzDevoo/itzdevoo-website.git
ARG BRANCH=live
ARG BUILD_DATE
ARG VCS_REF

# Create app directory
WORKDIR /app

# Clone the repository and checkout the live branch
RUN git clone --depth 1 --branch ${BRANCH} ${GITHUB_REPO} . && \
    rm -rf .git

# Copy custom nginx configuration (from local build context)
COPY nginx.conf /etc/nginx/nginx.conf

# Copy website files to nginx directory
RUN cp -r index.html styles scripts sw.js site.webmanifest robots.txt /usr/share/nginx/html/ && \
    rm -rf /usr/share/nginx/html/project-scripts && \
    rm -rf /usr/share/nginx/html/.kiro && \
    rm -rf /usr/share/nginx/html/.github && \
    rm -rf /usr/share/nginx/html/Dockerfile* && \
    rm -rf /usr/share/nginx/html/docker-compose* && \
    rm -rf /usr/share/nginx/html/*.md

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
    find /usr/share/nginx/html -type d -exec chmod 755 {} \;

# Security: Clean up
RUN rm -rf /var/cache/apk/* && \
    rm -rf /tmp/* && \
    rm -rf /app

# Expose port
EXPOSE 8080

# Add labels for better container management
LABEL maintainer="ItzDevoo <contact@itzdevoo.com>" \
      version="1.0.0" \
      description="ItzDevoo Professional Website - Git Deployed" \
      org.opencontainers.image.title="ItzDevoo Website" \
      org.opencontainers.image.description="Professional website deployed from GitHub live branch" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.source="https://github.com/ItzDevoo/itzdevoo-website" \
      org.opencontainers.image.licenses="Private" \
      deployment.source="github" \
      deployment.branch="${BRANCH}" \
      deployment.repo="${GITHUB_REPO}"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start nginx
STOPSIGNAL SIGQUIT
CMD ["nginx", "-g", "daemon off;"]