#!/usr/bin/env bash
set -euo pipefail

KOTLIN_POST_PROCESS_FILE="ktlint -F" openapi-generator-cli generate -i api/openapi.yaml -g kotlin-spring --additional-properties="useSpringBoot4=true,useTags=true,interfaceOnly=true" --enable-post-process-file -o services/spring-api

openapi-python-client generate --path api/openapi.yaml --output-path services/py-help-service/client --overwrite
openapi-python-client generate --path api/openapi.yaml --output-path services/py-recipe-service/client --overwrite

npx openapi-typescript api/openapi.yaml -o web-client/src/api.ts