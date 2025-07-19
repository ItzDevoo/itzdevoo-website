# Multi-stage build for ItzDevoo website
FROM nginx:alpine as production

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy website files to nginx html directory
COPY . /usr/share/nginx/html/

# Remove unnecessary files from html directory
RUN rm -f /usr/share/nginx/html/Dockerfile \
    /usr/share/nginx/html/nginx.conf \
    /usr/share/nginx/html/.git* \
    /usr/share/nginx/html/*.md

# Create nginx cache directories
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp

# Set proper permissions
RUN chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/log/nginx

# Create non-root user for running nginx
RUN addgroup -g 101 -S nginx-user \
    && adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx-user -g nginx-user nginx-user

# Switch to non-root user
USER nginx-user

# Expose port 8080 (matching your nginx config)
EXPOSE 8080

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]