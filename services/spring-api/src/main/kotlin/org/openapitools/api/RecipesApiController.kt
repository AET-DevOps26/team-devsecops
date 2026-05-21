package org.openapitools.api

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import io.swagger.v3.oas.annotations.*
import io.swagger.v3.oas.annotations.enums.*
import io.swagger.v3.oas.annotations.media.*
import io.swagger.v3.oas.annotations.responses.*
import io.swagger.v3.oas.annotations.security.*
import jakarta.validation.Valid
import org.openapitools.entity.RecipeEntity
import org.openapitools.model.Recipe
import org.openapitools.model.RecipeIngredient
import org.openapitools.model.RecipeInput
import org.openapitools.model.RecipeNutrients
import org.openapitools.repository.RecipeRepository
import org.openapitools.repository.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*

@RestController
@Validated
@RequestMapping("\${api.base-path:/api/v1}")
class RecipesApiController(
	private val recipeRepository: RecipeRepository,
	private val userRepository: UserRepository,
	private val objectMapper: ObjectMapper,
) {
	@Operation(
		summary = "List user recipes",
		operationId = "recipesGet",
		responses = [ApiResponse(responseCode = "200", description = "List of recipes")],
		security = [SecurityRequirement(name = "bearerAuth")],
	)
	@RequestMapping(method = [RequestMethod.GET], value = [PATH_RECIPES_GET])
	fun recipesGet(
		@AuthenticationPrincipal principal: UserDetails,
	): ResponseEntity<List<Recipe>> {
		val user = userRepository.findByUsername(principal.username).orElseThrow()
		val recipes = recipeRepository.findByUserId(user.id).map { it.toApiModel() }
		return ResponseEntity.ok(recipes)
	}

	@Operation(
		summary = "Save a recipe",
		operationId = "recipesPost",
		responses = [ApiResponse(responseCode = "201", description = "Recipe saved")],
		security = [SecurityRequirement(name = "bearerAuth")],
	)
	@RequestMapping(method = [RequestMethod.POST], value = [PATH_RECIPES_POST], consumes = ["application/json"])
	fun recipesPost(
		@Parameter(description = "", required = true) @Valid @RequestBody recipe: RecipeInput,
		@AuthenticationPrincipal principal: UserDetails,
	): ResponseEntity<Unit> {
		val user = userRepository.findByUsername(principal.username).orElseThrow()
		recipeRepository.save(
			RecipeEntity(
				title = recipe.title,
				ingredients = objectMapper.writeValueAsString(recipe.ingredients),
				instructions = objectMapper.writeValueAsString(recipe.instructions),
				portions = recipe.portions,
				nutrientKcal = recipe.nutrients?.calories ?: 0,
				nutrientCarb = recipe.nutrients?.carbs ?: 0,
				nutrientProt = recipe.nutrients?.protein ?: 0,
				nutrientFat = recipe.nutrients?.fat ?: 0,
				user = user,
			),
		)
		return ResponseEntity(HttpStatus.CREATED)
	}

	@Operation(
		summary = "Get recipe by ID",
		operationId = "recipesRecipeIdGet",
		responses = [ApiResponse(responseCode = "200", description = "Recipe details")],
		security = [SecurityRequirement(name = "bearerAuth")],
	)
	@RequestMapping(method = [RequestMethod.GET], value = [PATH_RECIPES_RECIPE_ID_GET])
	fun recipesRecipeIdGet(
		@AuthenticationPrincipal principal: UserDetails,
		@Parameter(description = "", required = true) @PathVariable("recipeId") recipeId: String,
	): ResponseEntity<Recipe> {
		val id = recipeId.toLongOrNull() ?: return ResponseEntity(HttpStatus.BAD_REQUEST)
		val entity = recipeRepository.findById(id).orElse(null) ?: return ResponseEntity(HttpStatus.NOT_FOUND)
		val user = userRepository.findByUsername(principal.username).orElseThrow()
		if (entity.user.id != user.id) return ResponseEntity(HttpStatus.FORBIDDEN)
		return ResponseEntity.ok(entity.toApiModel())
	}

	private fun RecipeEntity.toApiModel() =
		Recipe(
			id = id,
			title = title,
			ingredients = objectMapper.readValue(ingredients, object : TypeReference<List<RecipeIngredient>>() {}),
			instructions = objectMapper.readValue(instructions, object : TypeReference<List<String>>() {}),
			portions = portions,
			nutrients =
				RecipeNutrients(
					calories = nutrientKcal,
					carbs = nutrientCarb,
					protein = nutrientProt,
					fat = nutrientFat,
				),
		)

	companion object {
		const val BASE_PATH: String = "/api/v1"
		const val PATH_RECIPES_GET: String = "/recipes"
		const val PATH_RECIPES_POST: String = "/recipes"
		const val PATH_RECIPES_RECIPE_ID_GET: String = "/recipes/{recipeId}"
	}
}
