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
import org.slf4j.LoggerFactory
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.reactive.function.client.WebClient
import tools.jackson.databind.ObjectMapper
import java.time.Duration
import java.util.concurrent.TimeoutException

@RestController
@Validated
@RequestMapping("\${api.base-path:/api/v1}")
class AIApiController(
	private val aiHelpWebClient: WebClient,
	private val aiRecipeWebClient: WebClient,
	private val userRepository: UserRepository,
	private val objectMapper: ObjectMapper,
) : AIApi {
	private val log = LoggerFactory.getLogger(javaClass)

	// Cap how long we wait on the GenAI service before returning an error
	private val aiTimeout = Duration.ofSeconds(60)

	override fun aiHelpPost(
		@Valid helpRequest: HelpRequest,
	): ResponseEntity<HelpResponse> {
		val username = currentUsername()
		log.info("Help request [user={}, promptLength={}]", username, helpRequest.prompt.length)
		val user = userRepository.findByUsername(username).orElseThrow()
		val response =
			aiHelpWebClient
				.post()
				.uri("/ai/help")
				.contentType(MediaType.APPLICATION_JSON)
				.bodyValue(
					objectMapper.writeValueAsString(
						mapOf(
							"profile" to user.toProfile(),
							"recipe" to helpRequest.recipe,
							"prompt" to helpRequest.prompt,
						),
					),
				).retrieve()
				.bodyToMono(HelpResponse::class.java)
				.timeout(aiTimeout)
				.onErrorMap(TimeoutException::class.java) { GatewayTimeoutException("GenAI service timed out") }
				.block() ?: throw BadGatewayException("GenAI service unavailable or returned an unparseable response")
		log.info("Help response delivered [user={}]", username)
		return ResponseEntity.ok(response)
	}

	override fun aiRecipesPost(
		@Valid recipeRequest: RecipeRequest,
	): ResponseEntity<List<RecipeInput>> {
		val username = currentUsername()
		log.info("Recipe generation request [user={}, promptLength={}]", username, recipeRequest.prompt.length)
		val user = userRepository.findByUsername(username).orElseThrow()
		// the client sends the active UI language so generated recipes match what the user sees,
		// even when no language is stored in their preferences
		val profile = user.toProfile()
		val profileWithLanguage =
			recipeRequest.language?.let {
				profile.copy(preferences = profile.preferences.copy(language = it))
			} ?: profile
		val recipes =
			aiRecipeWebClient
				.post()
				.uri("/ai/recipes")
				.contentType(MediaType.APPLICATION_JSON)
				.bodyValue(objectMapper.writeValueAsString(mapOf("profile" to profileWithLanguage, "prompt" to recipeRequest.prompt)))
				.retrieve()
				.bodyToMono(object : ParameterizedTypeReference<List<RecipeInput>>() {})
				.timeout(aiTimeout)
				.onErrorMap(TimeoutException::class.java) { GatewayTimeoutException("GenAI service timed out") }
				.block() ?: throw BadGatewayException("GenAI service unavailable or returned an unparseable response")
		log.info("Recipe generation complete [user={}, count={}]", username, recipes.size)
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
