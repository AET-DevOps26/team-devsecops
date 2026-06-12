# --- Build stage ---
FROM sapmachine:21 AS builder
WORKDIR /app
COPY gradlew settings.gradle build.gradle.kts ./
COPY gradle ./gradle
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew dependencies --no-daemon -q
COPY src ./src
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew bootJar --no-daemon -x test

# --- Run stage ---
FROM sapmachine:21
WORKDIR /app
COPY --from=builder /app/build/libs/app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]