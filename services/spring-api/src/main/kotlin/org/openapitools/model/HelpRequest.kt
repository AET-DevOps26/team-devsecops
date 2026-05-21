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
import org.openapitools.model.RecipeInput
import java.util.Objects

/**
 *
 * @param recipe
 * @param prompt
 */
data class HelpRequest(
	@field:Valid
	@Schema(example = "null", required = true, description = "")
	@get:JsonProperty("recipe", required = true) val recipe: RecipeInput,
	@get:Size(min = 1, max = 2000)
	@Schema(example = "null", required = true, description = "")
	@get:JsonProperty("prompt", required = true) val prompt: kotlin.String,
)
