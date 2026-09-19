FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B -DskipTests package && cp target/*.jar app.jar

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/app.jar app.jar
# Render sets $PORT; server.port in application.yml is overridden via SERVER_PORT.
ENV SERVER_PORT=8081
EXPOSE 8081
ENTRYPOINT ["sh", "-c", "java -jar app.jar --server.port=${PORT:-8081}"]
