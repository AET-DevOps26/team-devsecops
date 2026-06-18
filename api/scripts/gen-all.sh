#!/usr/bin/env bash
set -euo pipefail

KOTLIN_POST_PROCESS_FILE="ktlint -F" openapi-generator-cli generate \
    -i api/openapi.yaml \
    -g kotlin-spring \
    --additional-properties="useSpringBoot4=true,useTags=true,interfaceOnly=true,apiPackage=org.openapitools.api,modelPackage=org.openapitools.model" \
    --type-mappings=number=kotlin.Double \
    --enable-post-process-file \
    -o services/spring-api

npx openapi-typescript api/openapi.yaml -o web-client/src/api.ts

openapi-generator-cli generate \
  -i api/openapi-internal.yaml \
  -g kotlin \
  --global-property="apis,models,apiDocs=false,modelDocs=false" \
  --additional-properties="library=jvm-retrofit2,apiPackage=org.openapitools.internal.client,modelPackage=org.openapitools.internal.model,infrastructurePackage=org.openapitools.internal.client" \
  --type-mappings=number=kotlin.Double \
  --import-mappings=BigDecimal=java.lang.Double \
  -o services/spring-api

# delete lines causing compilation failures because of missing references
if sed --version 2>&1 | grep -q "GNU"; then
  # Linux (GNU sed)
  sed -i '/import org.openapitools.client.infrastructure/d' services/spring-api/src/main/kotlin/org/openapitools/internal/client/*ServiceApi.kt
else
  # macOS (BSD sed)
  sed -i '' '/import org.openapitools.client.infrastructure/d' services/spring-api/src/main/kotlin/org/openapitools/internal/client/*ServiceApi.kt
fi

# delete generated tests for generated code because of compatibility issues
rm -rf services/spring-api/src/test/kotlin/org/openapitools/internal/

# Generates the internal servers/client sdks for the Python Help Service.
openapi-python-client generate \
  --path api/openapi-internal.yaml \
  --output-path services/py-help-service/client \
  --overwrite

# Generates the internal servers/client sdks for the Python Recipe Service.
openapi-python-client generate \
  --path api/openapi-internal.yaml \
  --output-path services/py-recipe-service/client \
  --overwrite
