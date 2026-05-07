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
import org.openapitools.model.Recipe
import java.util.Objects

/**
 *
 * @param prompt
 * @param recipe
 */
data class HelpRequest(
	@Schema(example = "null", required = true, description = "")
	@get:JsonProperty("prompt", required = true) val prompt: kotlin.String,
	@field:Valid
	@Schema(example = "null", description = "")
	@get:JsonProperty("recipe") val recipe: Recipe? = null,
)
