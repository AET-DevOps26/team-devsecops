package org.openapitools.api

import jakarta.validation.constraints.Min
import org.openapitools.entity.RecipeEntity
import org.openapitools.model.Recipe
import org.openapitools.model.RecipeIngredient
import org.openapitools.model.RecipeInput
import org.openapitools.model.RecipeNutrients
import org.openapitools.repository.RecipeRepository
import org.openapitools.repository.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import tools.jackson.core.type.TypeReference
import tools.jackson.databind.ObjectMapper

@RestController
@Validated
@RequestMapping("\${api.base-path:/api/v1}")
class RecipesApiController(
	private val recipeRepository: RecipeRepository,
	private val userRepository: UserRepository,
	private val objectMapper: ObjectMapper,
) : RecipesApi {
	override fun recipesGet(): ResponseEntity<List<Recipe>> {
		val user = userRepository.findByUsername(currentUsername()).orElseThrow()
		return ResponseEntity.ok(recipeRepository.findByUserId(user.id).map { it.toApiModel() })
	}

	override fun recipesPost(recipeInput: RecipeInput): ResponseEntity<Unit> {
		val user = userRepository.findByUsername(currentUsername()).orElseThrow()
		recipeRepository.save(
			RecipeEntity(
				title = recipeInput.title,
				ingredients = objectMapper.writeValueAsString(recipeInput.ingredients),
				instructions = objectMapper.writeValueAsString(recipeInput.instructions),
				portions = recipeInput.portions,
				nutrientKcal = recipeInput.nutrients?.calories ?: 0,
				nutrientCarb = recipeInput.nutrients?.carbs ?: 0,
				nutrientProt = recipeInput.nutrients?.protein ?: 0,
				nutrientFat = recipeInput.nutrients?.fat ?: 0,
				user = user,
			),
		)
		return ResponseEntity(HttpStatus.CREATED)
	}

	override fun recipesRecipeIdGet(
		@Min(1) recipeId: Long,
	): ResponseEntity<Recipe> {
		val entity = recipeRepository.findById(recipeId).orElseThrow { NotFoundException("Recipe not found") }
		val user = userRepository.findByUsername(currentUsername()).orElseThrow()
		if (entity.user.id != user.id) throw ForbiddenException("Recipe belongs to a different user")
		return ResponseEntity.ok(entity.toApiModel())
	}

	private fun currentUsername(): String = SecurityContextHolder.getContext().authentication!!.name

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
}
