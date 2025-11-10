FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create directories for SSL certificates and certbot
RUN mkdir -p /etc/nginx/ssl /var/www/certbot

# Create self-signed certificate for initial setup (will be replaced by Let's Encrypt)
RUN apk add --no-cache openssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
