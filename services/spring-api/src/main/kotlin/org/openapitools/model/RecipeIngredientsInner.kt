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
 * @param quantity
 * @param unit
 * @param name
 */
data class RecipeIngredientsInner(
	@Schema(example = "null", description = "")
	@get:JsonProperty("quantity") val quantity: java.math.BigDecimal? = null,
	@Schema(example = "null", description = "")
	@get:JsonProperty("unit") val unit: kotlin.String? = null,
	@Schema(example = "null", description = "")
	@get:JsonProperty("name") val name: kotlin.String? = null,
)
