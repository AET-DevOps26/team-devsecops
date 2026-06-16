package org.openapitools.internal.client

import retrofit2.http.*
import retrofit2.Call
import okhttp3.RequestBody
import com.squareup.moshi.Json

import org.openapitools.internal.model.ErrorResponse
import org.openapitools.internal.model.HealthGet200Response
import org.openapitools.internal.model.RecipeInput
import org.openapitools.internal.model.RecipeRequestForwarded

interface RecipeServiceApi {
    /**
     * POST ai/recipes
     * Generate cooking recipes via LLM
     * Forwards user prompt queries along with their profiles to create new recipe suggestions.
     * Responses:
     *  - 200: AI recipe generation completed successfully
     *  - 400: Invalid prompt processing structure
     *  - 401: Missing security headers
     *  - 403: HMAC signature mismatch
     *  - 504: Upstream LangChain LLM orchestration layer timed out
     *
     * @param xInternalTimestamp Linux Unix epoch timestamp string binding the generation window to block replay attacks.
     * @param xInternalSignature Hex-encoded HMAC-SHA256 signature validating data package integrity over private networks.
     * @param recipeRequestForwarded 
     * @return [Call]<[kotlin.collections.List<RecipeInput>]>
     */
    @POST("ai/recipes")
    fun aiRecipesPost(@Header("X-Internal-Timestamp") xInternalTimestamp: kotlin.String, @Header("X-Internal-Signature") xInternalSignature: kotlin.String, @Body recipeRequestForwarded: RecipeRequestForwarded): Call<kotlin.collections.List<RecipeInput>>

    /**
     * GET health
     * Service Health Check
     * Verifies that the targeted internal microservice instance is responding normally.
     * Responses:
     *  - 200: Service is healthy
     *
     * @return [Call]<[HealthGet200Response]>
     */
    @GET("health")
    fun healthGet(): Call<HealthGet200Response>

}
