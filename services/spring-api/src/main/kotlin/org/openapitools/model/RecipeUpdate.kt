package org.openapitools.model

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonSetter
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
import org.openapitools.model.RecipeIngredient
import org.openapitools.model.RecipeNutrients
import java.util.Objects

/**
 * At least one field must be provided
 * @param title
 * @param ingredients
 * @param instructions
 * @param portions
 * @param nutrients
 */
data class RecipeUpdate(
	@get:Size(min = 1, max = 255)
	@Schema(example = "null", description = "")
	@field:JsonSetter(nulls = Nulls.FAIL)
	@get:JsonProperty("title") val title: kotlin.String? = null,
	@field:Valid
	@get:Size(min = 1)
	@Schema(example = "null", description = "")
	@field:JsonSetter(nulls = Nulls.FAIL)
	@get:JsonProperty("ingredients") val ingredients: kotlin.collections.List<RecipeIngredient>? = null,
	@get:Size(min = 1)
	@Schema(example = "null", description = "")
	@field:JsonSetter(nulls = Nulls.FAIL)
	@get:JsonProperty("instructions") val instructions: kotlin.collections.List<kotlin.String>? = null,
	@get:DecimalMin(value = "0.5")
	@Schema(example = "null", description = "")
	@field:JsonSetter(nulls = Nulls.FAIL)
	@get:JsonProperty("portions") val portions: java.math.BigDecimal? = null,
	@field:Valid
	@Schema(example = "null", description = "")
	@field:JsonSetter(nulls = Nulls.FAIL)
	@get:JsonProperty("nutrients") val nutrients: RecipeNutrients? = null,
)
