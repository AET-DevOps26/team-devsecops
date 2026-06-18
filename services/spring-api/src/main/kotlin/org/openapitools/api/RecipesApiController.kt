package org.openapitools.api

import org.openapitools.entity.RecipeEntity
import org.openapitools.model.Recipe
import org.openapitools.model.RecipeCreated
import org.openapitools.model.RecipeIngredient
import org.openapitools.model.RecipeInput
import org.openapitools.model.RecipeNutrients
import org.openapitools.model.RecipeUpdate
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
import java.time.Instant
import java.time.ZoneOffset

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

	override fun recipesPost(recipeInput: RecipeInput): ResponseEntity<RecipeCreated> {
		val user = userRepository.findByUsername(currentUsername()).orElseThrow()
		val saved =
			recipeRepository.save(
				RecipeEntity(
					title = recipeInput.title,
					ingredients = objectMapper.writeValueAsString(recipeInput.ingredients),
					instructions = objectMapper.writeValueAsString(recipeInput.instructions),
					portions = java.math.BigDecimal.valueOf(recipeInput.portions),
					nutrientKcal = recipeInput.nutrients?.calories ?: 0,
					nutrientCarb = recipeInput.nutrients?.carbs ?: 0,
					nutrientProt = recipeInput.nutrients?.protein ?: 0,
					nutrientFat = recipeInput.nutrients?.fat ?: 0,
					user = user,
				),
			)
		return ResponseEntity.status(HttpStatus.CREATED).body(RecipeCreated(id = saved.id))
	}

	override fun recipesRecipeIdGet(recipeId: Long): ResponseEntity<Recipe> {
		val entity = recipeRepository.findById(recipeId).orElseThrow { NotFoundException("Recipe not found") }
		val user = userRepository.findByUsername(currentUsername()).orElseThrow()
		if (entity.user.id != user.id) throw ForbiddenException("Recipe belongs to a different user")
		entity.openedAt = Instant.now()
		recipeRepository.save(entity)
		return ResponseEntity.ok(entity.toApiModel())
	}

	override fun recipesRecipeIdPut(
		recipeId: Long,
		recipeUpdate: RecipeUpdate,
	): ResponseEntity<Recipe> {
		val entity = recipeRepository.findById(recipeId).orElseThrow { NotFoundException("Recipe not found") }
		val user = userRepository.findByUsername(currentUsername()).orElseThrow()
		if (entity.user.id != user.id) throw ForbiddenException("Recipe belongs to a different user")
		recipeUpdate.title?.let { entity.title = it }
		recipeUpdate.ingredients?.let { entity.ingredients = objectMapper.writeValueAsString(it) }
		recipeUpdate.instructions?.let { entity.instructions = objectMapper.writeValueAsString(it) }
		recipeUpdate.portions?.let { entity.portions = java.math.BigDecimal.valueOf(it) }
		recipeUpdate.nutrients?.let {
			entity.nutrientKcal = it.calories
			entity.nutrientCarb = it.carbs
			entity.nutrientProt = it.protein
			entity.nutrientFat = it.fat
		}
		entity.editedAt = Instant.now()
		return ResponseEntity.ok(recipeRepository.save(entity).toApiModel())
	}

	override fun recipesRecipeIdDelete(recipeId: Long): ResponseEntity<Unit> {
		val entity = recipeRepository.findById(recipeId).orElseThrow { NotFoundException("Recipe not found") }
		val user = userRepository.findByUsername(currentUsername()).orElseThrow()
		if (entity.user.id != user.id) throw ForbiddenException("Recipe belongs to a different user")
		recipeRepository.delete(entity)
		return ResponseEntity(HttpStatus.NO_CONTENT)
	}

	private fun currentUsername(): String = SecurityContextHolder.getContext().authentication!!.name

	private fun RecipeEntity.toApiModel() =
		Recipe(
			id = id,
			title = title,
			ingredients = objectMapper.readValue(ingredients, object : TypeReference<List<RecipeIngredient>>() {}),
			instructions = objectMapper.readValue(instructions, object : TypeReference<List<String>>() {}),
			portions = portions.toDouble(),
			nutrients =
				RecipeNutrients(
					calories = nutrientKcal,
					carbs = nutrientCarb,
					protein = nutrientProt,
					fat = nutrientFat,
				),
			createdAt = createdAt.atOffset(ZoneOffset.UTC),
			editedAt = editedAt.atOffset(ZoneOffset.UTC),
			openedAt = openedAt?.atOffset(ZoneOffset.UTC),
		)
}
