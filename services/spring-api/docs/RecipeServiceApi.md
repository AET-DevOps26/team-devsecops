# RecipeServiceApi

All URIs are relative to *http://localhost:8080*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**aiRecipesPost**](RecipeServiceApi.md#aiRecipesPost) | **POST** ai/recipes | Generate cooking recipes via LLM |
| [**healthGet**](RecipeServiceApi.md#healthGet) | **GET** health | Service Health Check |



Generate cooking recipes via LLM

Forwards user prompt queries along with their profiles to create new recipe suggestions.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.*
//import org.openapitools.client.infrastructure.*
//import org.openapitools.internal.model.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(RecipeServiceApi::class.java)
val xInternalTimestamp : kotlin.String = xInternalTimestamp_example // kotlin.String | Linux Unix epoch timestamp string binding the generation window to block replay attacks.
val xInternalSignature : kotlin.String = xInternalSignature_example // kotlin.String | Hex-encoded HMAC-SHA256 signature validating data package integrity over private networks.
val recipeRequestForwarded : RecipeRequestForwarded =  // RecipeRequestForwarded | 

val result : kotlin.collections.List<RecipeInput> = webService.aiRecipesPost(xInternalTimestamp, xInternalSignature, recipeRequestForwarded)
```

### Parameters
| **xInternalTimestamp** | **kotlin.String**| Linux Unix epoch timestamp string binding the generation window to block replay attacks. | |
| **xInternalSignature** | **kotlin.String**| Hex-encoded HMAC-SHA256 signature validating data package integrity over private networks. | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **recipeRequestForwarded** | [**RecipeRequestForwarded**](RecipeRequestForwarded.md)|  | |

### Return type

[**kotlin.collections.List&lt;RecipeInput&gt;**](RecipeInput.md)

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
val webService = apiClient.createWebservice(RecipeServiceApi::class.java)

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

