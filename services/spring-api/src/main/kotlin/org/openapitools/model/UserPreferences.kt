package org.openapitools.model

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonValue
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
import org.openapitools.model.Language
import java.util.Objects

/**
 *
 * @param language Preferred UI and AI-content language as an ISO 639-1 code
 * @param theme Preferred UI colour theme; AUTO follows the OS preference
 * @param diet Dietary restriction or style (e.g. vegan, keto)
 * @param allergies List of ingredients the user is allergic to
 * @param aboutMe Free-form user context provided to the AI
 */
data class UserPreferences(
	@field:Valid
	@Schema(example = "null", description = "Preferred UI and AI-content language as an ISO 639-1 code")
	@get:JsonProperty("language") val language: Language? = null,
	@Schema(example = "null", description = "Preferred UI colour theme; AUTO follows the OS preference")
	@get:JsonProperty("theme") val theme: UserPreferences.Theme? = null,
	@Schema(example = "null", description = "Dietary restriction or style (e.g. vegan, keto)")
	@get:JsonProperty("diet") val diet: kotlin.collections.List<kotlin.String>? = null,
	@Schema(example = "null", description = "List of ingredients the user is allergic to")
	@get:JsonProperty("allergies") val allergies: kotlin.collections.List<kotlin.String>? = null,
	@Schema(example = "null", description = "Free-form user context provided to the AI")
	@get:JsonProperty("aboutMe") val aboutMe: kotlin.collections.List<kotlin.String>? = null,
) {
	/**
	 * Preferred UI colour theme; AUTO follows the OS preference
	 * Values: LIGHT,DARK,AUTO
	 */
	enum class Theme(
		@get:JsonValue val value: kotlin.String,
	) {
		LIGHT("LIGHT"),
		DARK("DARK"),
		AUTO("AUTO"),
		;

		companion object {
			@JvmStatic
			@JsonCreator
			fun forValue(value: kotlin.String): Theme =
				values().firstOrNull { it -> it.value == value }
					?: throw IllegalArgumentException("Unexpected value '$value' for enum 'Theme'")
		}
	}
}
