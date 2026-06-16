package org.openapitools.internal.client

import com.squareup.moshi.Json
import okhttp3.RequestBody
import org.openapitools.internal.model.ErrorResponse
import org.openapitools.internal.model.HealthGet200Response
import org.openapitools.internal.model.HelpRequestForwarded
import org.openapitools.internal.model.HelpResponse
import retrofit2.Call
import retrofit2.http.*

interface HelpServiceApi {
	/**
	 * POST ai/help
	 * Process contextual help request via LLM
	 * Receives a cooking query bundled with rich user profile constraints and active recipe schemas to build safe prompts.
	 * Responses:
	 *  - 200: AI help generation completed successfully
	 *  - 400: Invalid request payload syntax or corrupted internal header data
	 *  - 401: Unauthorized due to missing headers or an expired timestamp window
	 *  - 403: Forbidden due to an invalid cryptographic HMAC validation mismatch
	 *  - 504: Upstream LangChain LLM orchestration layer timed out
	 *
	 * @param xInternalTimestamp Linux Unix epoch timestamp string binding the generation window to block replay attacks.
	 * @param xInternalSignature Hex-encoded HMAC-SHA256 signature validating data package integrity over private networks.
	 * @param helpRequestForwarded
	 * @return [Call]<[HelpResponse]>
	 */
	@POST("ai/help")
	fun aiHelpPost(
		@Header("X-Internal-Timestamp") xInternalTimestamp: kotlin.String,
		@Header("X-Internal-Signature") xInternalSignature: kotlin.String,
		@Body helpRequestForwarded: HelpRequestForwarded,
	): Call<HelpResponse>

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
