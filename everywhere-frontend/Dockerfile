# Imagen base ligera de Nginx Alpine
FROM nginx:alpine

# Copiamos la configuración personalizada de Nginx para Angular SPA (rutas con try_files)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos compilados de Angular 20
COPY dist/everywhere-frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
