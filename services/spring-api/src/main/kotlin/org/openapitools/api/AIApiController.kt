package org.openapitools.api

import io.swagger.v3.oas.annotations.*
import io.swagger.v3.oas.annotations.enums.*
import io.swagger.v3.oas.annotations.media.*
import io.swagger.v3.oas.annotations.responses.*
import io.swagger.v3.oas.annotations.security.*
import jakarta.validation.Valid
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.openapitools.model.HelpRequest
import org.openapitools.model.HelpResponse
import org.openapitools.model.RecipeRequest
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import org.springframework.web.context.request.NativeWebRequest
import org.springframework.web.reactive.function.client.WebClient
import kotlin.collections.List
import kotlin.collections.Map

@RestController
@Validated
@RequestMapping("\${api.base-path:/api/v1}")
class AIApiController(
	private val aiWebClient: WebClient,
) {
	@Operation(
		summary = "Ask AI cooking assistant for help",
		operationId = "aiHelpPost",
		description = """""",
		responses = [
			ApiResponse(responseCode = "200", description = "AI response"),
		],
	)
	@RequestMapping(
		method = [RequestMethod.POST],
		// "/ai/help"
		value = [PATH_AI_HELP_POST],
		consumes = ["application/json"],
	)
	fun aiHelpPost(
		@Parameter(description = "", required = true) @Valid @RequestBody helpRequest: HelpRequest,
	): HelpResponse {
		val response =
			aiWebClient
				.post()
				.uri("/generate/help")
				.contentType(MediaType.APPLICATION_JSON)
				.bodyValue(helpRequest)
				.retrieve()
				.bodyToMono(HelpResponse::class.java)
				.block()
		return response ?: HelpResponse("No response from AI")
	}

	@Operation(
		summary = "Generate recipes using AI",
		operationId = "aiRecipesPost",
		description = """""",
		responses = [
			ApiResponse(responseCode = "200", description = "Generated recipes"),
		],
		security = [ SecurityRequirement(name = "bearerAuth") ],
	)
	@RequestMapping(
		method = [RequestMethod.POST],
		// "/ai/recipes"
		value = [PATH_AI_RECIPES_POST],
		consumes = ["application/json"],
	)
	fun aiRecipesPost(
		@Parameter(description = "", required = true) @Valid @RequestBody recipeRequest: RecipeRequest,
	): ResponseEntity<Unit> = ResponseEntity(HttpStatus.NOT_IMPLEMENTED)

	companion object {
		// for your own safety never directly reuse these path definitions in tests
		const val BASE_PATH: String = "/api/v1"
		const val PATH_AI_HELP_POST: String = "/ai/help"
		const val PATH_AI_RECIPES_POST: String = "/ai/recipes"
	}
}
