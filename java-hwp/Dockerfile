# --- build ---------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
# Cache dependencies first (pom rarely changes vs. source).
COPY pom.xml .
RUN mvn -q -e -B dependency:go-offline
COPY src ./src
RUN mvn -q -e -B clean package -DskipTests

# --- run -----------------------------------------------------------------
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/hwp-api-1.0.0.jar app.jar
EXPOSE 8000
ENTRYPOINT ["java", "-jar", "app.jar"]
