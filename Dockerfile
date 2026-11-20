# Imagen única para publicar el sistema: el backend (Spring Boot) también sirve la pantalla (React).
# Sirve igual en Railway, Render o un servidor propio.

# 1) Construir la pantalla (React + Vite)
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2) Construir el backend con la pantalla incluida
FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /app/backend
COPY backend/pom.xml ./
RUN mvn -q -B dependency:go-offline
COPY backend/src ./src
COPY --from=frontend /app/frontend/dist ./src/main/resources/static
# Las pruebas necesitan PostgreSQL; se corren aparte con `mvn test`.
RUN mvn -q -B package -DskipTests

# 3) Imagen final, solo con Java
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=backend /app/backend/target/*.jar app.jar
USER app
ENV PORT=8080 JAVA_OPTS="-XX:MaxRAMPercentage=75"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
