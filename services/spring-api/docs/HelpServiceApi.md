# HelpServiceApi

All URIs are relative to *http://localhost:8080*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**aiHelpPost**](HelpServiceApi.md#aiHelpPost) | **POST** ai/help | Process contextual help request via LLM |
| [**healthGet**](HelpServiceApi.md#healthGet) | **GET** health | Service Health Check |



Process contextual help request via LLM

Receives a cooking query bundled with rich user profile constraints and active recipe schemas to build safe prompts.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.*
//import org.openapitools.client.infrastructure.*
//import org.openapitools.internal.model.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(HelpServiceApi::class.java)
val xInternalTimestamp : kotlin.String = xInternalTimestamp_example // kotlin.String | Linux Unix epoch timestamp string binding the generation window to block replay attacks.
val xInternalSignature : kotlin.String = xInternalSignature_example // kotlin.String | Hex-encoded HMAC-SHA256 signature validating data package integrity over private networks.
val helpRequestForwarded : HelpRequestForwarded =  // HelpRequestForwarded | 

val result : HelpResponse = webService.aiHelpPost(xInternalTimestamp, xInternalSignature, helpRequestForwarded)
```

### Parameters
| **xInternalTimestamp** | **kotlin.String**| Linux Unix epoch timestamp string binding the generation window to block replay attacks. | |
| **xInternalSignature** | **kotlin.String**| Hex-encoded HMAC-SHA256 signature validating data package integrity over private networks. | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **helpRequestForwarded** | [**HelpRequestForwarded**](HelpRequestForwarded.md)|  | |

### Return type

[**HelpResponse**](HelpResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Service Health Check

Verifies that the targeted internal microservice instance is responding normally.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.*
//import org.openapitools.client.infrastructure.*
//import org.openapitools.internal.model.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(HelpServiceApi::class.java)

val result : HealthGet200Response = webService.healthGet()
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**HealthGet200Response**](HealthGet200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

