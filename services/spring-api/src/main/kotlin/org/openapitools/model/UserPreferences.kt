package org.openapitools.model

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonSetter
import com.fasterxml.jackson.annotation.JsonValue
import com.fasterxml.jackson.annotation.Nulls
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
 * @param language Preferred UI and AI-content language as an ISO 639-1 code
 * @param diet Dietary restriction or style (e.g. vegan, keto)
 * @param allergies List of ingredients the user is allergic to
 * @param aboutMe Free-form user context provided to the AI
 */
data class UserPreferences(
	@Schema(example = "null", description = "Preferred UI and AI-content language as an ISO 639-1 code")
	@field:JsonSetter(nulls = Nulls.FAIL)
	@get:JsonProperty("language") val language: UserPreferences.Language? = null,
	@Schema(example = "null", description = "Dietary restriction or style (e.g. vegan, keto)")
	@field:JsonSetter(nulls = Nulls.FAIL)
	@get:JsonProperty("diet") val diet: kotlin.collections.List<kotlin.String>? = null,
	@Schema(example = "null", description = "List of ingredients the user is allergic to")
	@field:JsonSetter(nulls = Nulls.FAIL)
	@get:JsonProperty("allergies") val allergies: kotlin.collections.List<kotlin.String>? = null,
	@Schema(example = "null", description = "Free-form user context provided to the AI")
	@field:JsonSetter(nulls = Nulls.FAIL)
	@get:JsonProperty("aboutMe") val aboutMe: kotlin.collections.List<kotlin.String>? = null,
) {
	/**
	 * Preferred UI and AI-content language as an ISO 639-1 code
	 * Values: en,de,hu
	 */
	enum class Language(
		@get:JsonValue val value: kotlin.String,
	) {
		en("en"),
		de("de"),
		hu("hu"),
		;

		companion object {
			@JvmStatic
			@JsonCreator
			fun forValue(value: kotlin.String): Language =
				values().firstOrNull { it -> it.value == value }
					?: throw IllegalArgumentException("Unexpected value '$value' for enum 'Language'")
		}
	}
}
