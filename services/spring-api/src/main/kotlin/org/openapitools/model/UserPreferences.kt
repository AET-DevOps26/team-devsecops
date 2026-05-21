package org.openapitools.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.util.Objects

/**
 *
 * @param diet Dietary restriction or style (e.g. vegan, keto)
 * @param allergies List of ingredients the user is allergic to
 * @param aboutMe Free-form user context provided to the AI
 */
data class UserPreferences(
	@Schema(example = "null", description = "Dietary restriction or style (e.g. vegan, keto)")
	@get:JsonProperty("diet") val diet: kotlin.String? = null,
	@Schema(example = "null", description = "List of ingredients the user is allergic to")
	@get:JsonProperty("allergies") val allergies: kotlin.collections.List<kotlin.String>? = null,
	@Schema(example = "null", description = "Free-form user context provided to the AI")
	@get:JsonProperty("aboutMe") val aboutMe: kotlin.collections.List<kotlin.String>? = null,
)
