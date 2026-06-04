#!/bin/sh
set -eu

: "${NGINX_SERVER_NAME:=localhost}"
: "${NGINX_SHELL_UPSTREAM:=shell:3000}"
: "${NGINX_SERVER_UPSTREAM:=server:4000}"
: "${NGINX_SSL_CERT:=/etc/nginx/certs/dev.crt}"
: "${NGINX_SSL_KEY:=/etc/nginx/certs/dev.key}"

mkdir -p "$(dirname "${NGINX_SSL_CERT}")"

if [ ! -f "${NGINX_SSL_CERT}" ] || [ ! -f "${NGINX_SSL_KEY}" ]; then
  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout "${NGINX_SSL_KEY}" \
    -out "${NGINX_SSL_CERT}" \
    -subj "/CN=${NGINX_SERVER_NAME}"
fi

envsubst '${NGINX_SERVER_NAME} ${NGINX_SHELL_UPSTREAM} ${NGINX_SERVER_UPSTREAM} ${NGINX_SSL_CERT} ${NGINX_SSL_KEY}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
