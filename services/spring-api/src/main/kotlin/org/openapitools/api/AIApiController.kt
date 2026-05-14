package org.openapitools.api

import com.fasterxml.jackson.databind.ObjectMapper
import io.swagger.v3.oas.annotations.*
import io.swagger.v3.oas.annotations.enums.*
import io.swagger.v3.oas.annotations.media.*
import io.swagger.v3.oas.annotations.responses.*
import io.swagger.v3.oas.annotations.security.*
import jakarta.validation.Valid
import org.openapitools.entity.UserEntity
import org.openapitools.model.HelpRequest
import org.openapitools.model.HelpResponse
import org.openapitools.model.RecipeInput
import org.openapitools.model.RecipeRequest
import org.openapitools.model.UserPreferences
import org.openapitools.model.UserProfile
import org.openapitools.repository.UserRepository
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import org.springframework.web.reactive.function.client.WebClient

@RestController
@Validated
@RequestMapping("\${api.base-path:/api/v1}")
class AIApiController(
	private val aiHelpWebClient: WebClient,
	private val aiRecipeWebClient: WebClient,
	private val userRepository: UserRepository,
	private val objectMapper: ObjectMapper,
) {
	@Operation(
		summary = "Ask AI cooking assistant for help",
		operationId = "aiHelpPost",
		responses = [ApiResponse(responseCode = "200", description = "AI response")],
		security = [SecurityRequirement(name = "bearerAuth")],
	)
	@RequestMapping(method = [RequestMethod.POST], value = [PATH_AI_HELP_POST], consumes = ["application/json"])
	fun aiHelpPost(
		@Parameter(description = "", required = true) @Valid @RequestBody helpRequest: HelpRequest,
		@AuthenticationPrincipal principal: UserDetails,
	): HelpResponse {
		val user = userRepository.findByUsername(principal.username).orElseThrow()
		return aiHelpWebClient
			.post()
			.uri(PATH_AI_HELP_POST)
			.contentType(MediaType.APPLICATION_JSON)
			.bodyValue(mapOf("profile" to user.toProfile(), "recipe" to helpRequest.recipe, "prompt" to helpRequest.prompt))
			.retrieve()
			.bodyToMono(HelpResponse::class.java)
			.block() ?: HelpResponse("No response from AI")
	}

	@Operation(
		summary = "Generate recipes using AI",
		operationId = "aiRecipesPost",
		responses = [ApiResponse(responseCode = "200", description = "Generated recipes")],
		security = [SecurityRequirement(name = "bearerAuth")],
	)
	@RequestMapping(method = [RequestMethod.POST], value = [PATH_AI_RECIPES_POST], consumes = ["application/json"])
	fun aiRecipesPost(
		@Parameter(description = "", required = true) @Valid @RequestBody recipeRequest: RecipeRequest,
		@AuthenticationPrincipal principal: UserDetails,
	): ResponseEntity<List<RecipeInput>> {
		val user = userRepository.findByUsername(principal.username).orElseThrow()
		val response =
			aiRecipeWebClient
				.post()
				.uri("/ai/recipes")
				.contentType(MediaType.APPLICATION_JSON)
				.bodyValue(mapOf("profile" to user.toProfile(), "prompt" to recipeRequest.prompt))
				.retrieve()
				.bodyToMono(RecipeInput::class.java)
				.block() ?: return ResponseEntity.internalServerError().build()
		return ResponseEntity.ok(listOf(response))
	}

	// Converts the DB user entity into the API UserProfile model, injecting real profile data.
	// Password is intentionally excluded — never forwarded to the AI service.
	private fun UserEntity.toProfile(): UserProfile {
		val prefs =
			preferences?.let {
				try {
					objectMapper.readValue(it, UserPreferences::class.java)
				} catch (_: Exception) {
					null
				}
			} ?: UserPreferences()
		return UserProfile(username = username, preferences = prefs)
	}

	companion object {
		const val BASE_PATH: String = "/api/v1"
		const val PATH_AI_HELP_POST: String = "/ai/help"
		const val PATH_AI_RECIPES_POST: String = "/ai/recipes"
	}
}
