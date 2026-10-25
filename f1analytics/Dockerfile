
# ===== BUILD SPRING BOOT =====
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# ===== RUNTIME AVEC PLAYWRIGHT =====
FROM mcr.microsoft.com/playwright/java:v1.48.0-noble

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
