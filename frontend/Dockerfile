FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# La URL del backend se fija al compilar (la usa el navegador, no el contenedor).
ARG VITE_API_URL=http://localhost:8080/api/v1
ARG VITE_ENCUESTA_URL=
ENV VITE_API_URL=$VITE_API_URL VITE_ENCUESTA_URL=$VITE_ENCUESTA_URL
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
