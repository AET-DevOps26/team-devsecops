package org.openapitools.model

import java.util.Objects
import com.fasterxml.jackson.annotation.JsonProperty
import org.openapitools.model.RecipeIngredient
import org.openapitools.model.RecipeNutrients
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import jakarta.validation.Valid
import io.swagger.v3.oas.annotations.media.Schema

/**
 * At least one field must be provided
 * @param title
 * @param ingredients
 * @param instructions
 * @param portions
 * @param nutrients
 */
data class RecipeUpdate(

    @get:Size(min=1,max=255)
    @Schema(example = "null", description = "")
    @get:JsonProperty("title") val title: kotlin.String? = null,

    @field:Valid
    @get:Size(min=1)
    @Schema(example = "null", description = "")
    @get:JsonProperty("ingredients") val ingredients: kotlin.collections.List<RecipeIngredient>? = null,

    @get:Size(min=1)
    @Schema(example = "null", description = "")
    @get:JsonProperty("instructions") val instructions: kotlin.collections.List<kotlin.String>? = null,

    @get:DecimalMin(value="0.5")
    @Schema(example = "null", description = "")
    @get:JsonProperty("portions") val portions: kotlin.Double? = null,

    @field:Valid
    @Schema(example = "null", description = "")
    @get:JsonProperty("nutrients") val nutrients: RecipeNutrients? = null
) {

}
