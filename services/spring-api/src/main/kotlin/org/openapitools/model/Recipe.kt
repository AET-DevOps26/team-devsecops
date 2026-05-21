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
import org.openapitools.model.RecipeIngredient
import org.openapitools.model.RecipeNutrients
import java.util.Objects

/**
 *
 * @param title
 * @param ingredients
 * @param instructions
 * @param portions
 * @param id
 * @param nutrients
 */
data class Recipe(
	@get:Size(min = 1, max = 255)
	@Schema(example = "null", required = true, description = "")
	@get:JsonProperty("title", required = true) val title: kotlin.String,
	@field:Valid
	@get:Size(min = 1)
	@Schema(example = "null", required = true, description = "")
	@get:JsonProperty("ingredients", required = true) val ingredients: kotlin.collections.List<RecipeIngredient>,
	@get:Size(min = 1)
	@Schema(example = "null", required = true, description = "")
	@get:JsonProperty("instructions", required = true) val instructions: kotlin.collections.List<kotlin.String>,
	@get:DecimalMin(value = "0.5")
	@Schema(example = "null", required = true, description = "")
	@get:JsonProperty("portions", required = true) val portions: java.math.BigDecimal,
	@get:Min(value = 1L)
	@Schema(example = "null", required = true, description = "")
	@get:JsonProperty("id", required = true) val id: kotlin.Long,
	@field:Valid
	@Schema(example = "null", description = "")
	@get:JsonProperty("nutrients") val nutrients: RecipeNutrients? = null,
)
