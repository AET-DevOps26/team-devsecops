package org.openapitools.api

import jakarta.validation.Valid
import org.openapitools.entity.UserEntity
import org.openapitools.model.HelpRequest
import org.openapitools.model.HelpResponse
import org.openapitools.model.RecipeInput
import org.openapitools.model.RecipeRequest
import org.openapitools.model.UserPreferences
import org.openapitools.model.UserProfile
import org.openapitools.repository.UserRepository
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.reactive.function.client.WebClient
import java.time.Duration
import java.util.concurrent.TimeoutException
import tools.jackson.databind.ObjectMapper

@RestController
@Validated
@RequestMapping("\${api.base-path:/api/v1}")
class AIApiController(
	private val aiHelpWebClient: WebClient,
	private val aiRecipeWebClient: WebClient,
	private val userRepository: UserRepository,
	private val objectMapper: ObjectMapper,
) : AIApi {
	// Cap how long we wait on the GenAI service before returning an error
	private val aiTimeout = Duration.ofSeconds(60)

	override fun aiHelpPost(@Valid helpRequest: HelpRequest): ResponseEntity<HelpResponse> {
		val user = userRepository.findByUsername(currentUsername()).orElseThrow()
		val response =
			aiHelpWebClient
				.post()
				.uri("/ai/help")
				.contentType(MediaType.APPLICATION_JSON)
				.bodyValue(mapOf("profile" to user.toProfile(), "recipe" to helpRequest.recipe, "prompt" to helpRequest.prompt))
				.retrieve()
				.bodyToMono(HelpResponse::class.java)
				.timeout(aiTimeout)
				.onErrorMap(TimeoutException::class.java) { GatewayTimeoutException("GenAI service timed out") }
				.block() ?: throw BadGatewayException("GenAI service unavailable or returned an unparseable response")
		return ResponseEntity.ok(response)
	}

	override fun aiRecipesPost(@Valid recipeRequest: RecipeRequest): ResponseEntity<List<RecipeInput>> {
		val user = userRepository.findByUsername(currentUsername()).orElseThrow()
		val recipes =
			aiRecipeWebClient
				.post()
				.uri("/ai/recipes")
				.contentType(MediaType.APPLICATION_JSON)
				.bodyValue(mapOf("profile" to user.toProfile(), "prompt" to recipeRequest.prompt))
				.retrieve()
				.bodyToMono(object : ParameterizedTypeReference<List<RecipeInput>>() {})
				.timeout(aiTimeout)
				.onErrorMap(TimeoutException::class.java) { GatewayTimeoutException("GenAI service timed out") }
				.block() ?: throw BadGatewayException("GenAI service unavailable or returned an unparseable response")
		return ResponseEntity.ok(recipes)
	}

	private fun currentUsername(): String = SecurityContextHolder.getContext().authentication!!.name

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
}
