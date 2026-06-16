package org.openapitools.api

import jakarta.validation.Valid
import org.openapitools.entity.UserEntity
import org.openapitools.internal.client.HelpServiceApi
import org.openapitools.internal.client.RecipeServiceApi
import org.openapitools.model.HelpRequest
import org.openapitools.model.HelpResponse
import org.openapitools.model.RecipeInput
import org.openapitools.model.RecipeRequest
import org.openapitools.model.UserPreferences
import org.openapitools.model.UserProfile
import org.openapitools.repository.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import tools.jackson.databind.ObjectMapper
import retrofit2.Response

@RestController
@Validated
@RequestMapping("\${api.base-path:/api/v1}")
class AIApiController(
	private val helpServiceApi: HelpServiceApi,
    private val recipeServiceApi: RecipeServiceApi,
	private val userRepository: UserRepository,
	private val objectMapper: ObjectMapper,
) : AIApi {
	
	override fun aiHelpPost(
        @Valid helpRequest: HelpRequest,
    ): ResponseEntity<HelpResponse> {
        val user = userRepository.findByUsername(currentUsername()).orElseThrow()

        val internalRequest = org.openapitools.internal.model.HelpRequestForwarded(
            profile = user.toInternalProfile(),
            prompt = helpRequest.prompt,
            recipe = helpRequest.recipe?.toInternalRecipe()
        )

        val retrofitResponse = helpServiceApi.aiHelpPost("", "", internalRequest).execute()
        val body = handleRetrofitResponse(retrofitResponse)

        return ResponseEntity.ok(HelpResponse(response = body.response))
    }

    override fun aiRecipesPost(
        @Valid recipeRequest: RecipeRequest,
    ): ResponseEntity<List<RecipeInput>> {
        val user = userRepository.findByUsername(currentUsername()).orElseThrow()

        val internalRequest = org.openapitools.internal.model.RecipeRequestForwarded(
            profile = user.toInternalProfile(),
            prompt = recipeRequest.prompt
        )

        val retrofitResponse = recipeServiceApi.aiRecipesPost("", "", internalRequest).execute()
        val internalRecipes = handleRetrofitResponse(retrofitResponse)

        val publicRecipes = internalRecipes.map { it.toPublicRecipe() }
        return ResponseEntity.ok(publicRecipes)
    }

    private fun currentUsername(): String = SecurityContextHolder.getContext().authentication!!.name

    /**
     * Helper to unwrap Retrofit responses and throw standard Spring Exceptions on failures
     */
    private fun <T> handleRetrofitResponse(response: Response<T>): T {
        if (!response.isSuccessful) {
            val errorBody = response.errorBody()?.string() ?: "Unknown error"
            if (response.code() == 504) {
                throw ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT, "GenAI service timed out")
            }
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "GenAI service error: $errorBody")
        }
        return response.body() ?: throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty response from GenAI service")
    }

    // -------------------------------------------------------------------------
    // MODEL MAPPING EXTENSIONS (Translates between Public and Internal DTOs)
    // -------------------------------------------------------------------------

    private fun UserEntity.toInternalProfile(): org.openapitools.internal.model.UserProfile {
        val publicPrefs = preferences?.let {
            try { objectMapper.readValue(it, UserPreferences::class.java) } catch (_: Exception) { null }
        } ?: UserPreferences()

        return org.openapitools.internal.model.UserProfile(
            username = username,
            preferences = org.openapitools.internal.model.UserPreferences(
                diet = publicPrefs.diet,
                allergies = publicPrefs.allergies,
                aboutMe = publicPrefs.aboutMe,
                
                // safely convert between the two different generated enum types using string matching
                language = publicPrefs.language?.name?.let { enumName ->
                    try {
                        org.openapitools.internal.model.UserPreferences.Language.valueOf(enumName)
                    } catch (_: IllegalArgumentException) {
                        null // Fallback gracefully if there's an unexpected mismatch
                }
            }
            )
        )
    }

    private fun org.openapitools.model.RecipeInput.toInternalRecipe(): org.openapitools.internal.model.RecipeInput {
        return org.openapitools.internal.model.RecipeInput(
            title = this.title,
            portions = this.portions,
            instructions = this.instructions,
            ingredients = this.ingredients.map {
                org.openapitools.internal.model.RecipeIngredient(name = it.name, quantity = it.quantity, unit = it.unit)
            },
            nutrients = this.nutrients?.let {
                org.openapitools.internal.model.RecipeNutrients(calories = it.calories, protein = it.protein, fat = it.fat, carbs = it.carbs)
            }
        )
    }

    private fun org.openapitools.internal.model.RecipeInput.toPublicRecipe(): org.openapitools.model.RecipeInput {
        return org.openapitools.model.RecipeInput(
            title = this.title,
            portions = this.portions,
            instructions = this.instructions,
            ingredients = this.ingredients.map {
                org.openapitools.model.RecipeIngredient(name = it.name, quantity = it.quantity, unit = it.unit)
            },
            nutrients = this.nutrients?.let {
                org.openapitools.model.RecipeNutrients(calories = it.calories, protein = it.protein, fat = it.fat, carbs = it.carbs)
            }
        )
    }

}
