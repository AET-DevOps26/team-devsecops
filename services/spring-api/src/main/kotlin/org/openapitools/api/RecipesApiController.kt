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
import org.openapitools.model.Recipe
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import org.springframework.web.context.request.NativeWebRequest
import kotlin.collections.List
import kotlin.collections.Map

@RestController
@Validated
@RequestMapping("\${api.base-path:/api/v1}")
class RecipesApiController {
	@Operation(
		summary = "List user recipes",
		operationId = "recipesGet",
		description = """""",
		responses = [
			ApiResponse(responseCode = "200", description = "List of recipes"),
		],
		security = [ SecurityRequirement(name = "bearerAuth") ],
	)
	@RequestMapping(
		method = [RequestMethod.GET],
		// "/recipes"
		value = [PATH_RECIPES_GET],
	)
	fun recipesGet(): ResponseEntity<Unit> = ResponseEntity(HttpStatus.NOT_IMPLEMENTED)

	@Operation(
		summary = "Save a recipe",
		operationId = "recipesPost",
		description = """""",
		responses = [
			ApiResponse(responseCode = "201", description = "Recipe saved"),
		],
		security = [ SecurityRequirement(name = "bearerAuth") ],
	)
	@RequestMapping(
		method = [RequestMethod.POST],
		// "/recipes"
		value = [PATH_RECIPES_POST],
		consumes = ["application/json"],
	)
	fun recipesPost(
		@Parameter(description = "", required = true) @Valid @RequestBody recipe: Recipe,
	): ResponseEntity<Unit> = ResponseEntity(HttpStatus.NOT_IMPLEMENTED)

	@Operation(
		summary = "Get recipe by ID",
		operationId = "recipesRecipeIdGet",
		description = """""",
		responses = [
			ApiResponse(responseCode = "200", description = "Recipe details"),
		],
		security = [ SecurityRequirement(name = "bearerAuth") ],
	)
	@RequestMapping(
		method = [RequestMethod.GET],
		// "/recipes/{recipeId}"
		value = [PATH_RECIPES_RECIPE_ID_GET],
	)
	fun recipesRecipeIdGet(
		@Parameter(description = "", required = true) @PathVariable("recipeId") recipeId: kotlin.String,
	): ResponseEntity<Unit> = ResponseEntity(HttpStatus.NOT_IMPLEMENTED)

	companion object {
		// for your own safety never directly reuse these path definitions in tests
		const val BASE_PATH: String = "/api/v1"
		const val PATH_RECIPES_GET: String = "/recipes"
		const val PATH_RECIPES_POST: String = "/recipes"
		const val PATH_RECIPES_RECIPE_ID_GET: String = "/recipes/{recipeId}"
	}
}
