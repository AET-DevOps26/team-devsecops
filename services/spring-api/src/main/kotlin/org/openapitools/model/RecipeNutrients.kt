package org.openapitools.model

import java.util.Objects
import com.fasterxml.jackson.annotation.JsonProperty
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
 *
 * @param calories Number of Calories (kcal)
 * @param protein Protein in grams
 * @param fat Fat in grams
 * @param carbs Carbohydrates in grams
 */
data class RecipeNutrients(

    @get:Min(value=0)
    @Schema(example = "null", required = true, description = "Number of Calories (kcal)")
    @get:JsonProperty("calories", required = true) val calories: kotlin.Int,

    @get:Min(value=0)
    @Schema(example = "null", required = true, description = "Protein in grams")
    @get:JsonProperty("protein", required = true) val protein: kotlin.Int,

    @get:Min(value=0)
    @Schema(example = "null", required = true, description = "Fat in grams")
    @get:JsonProperty("fat", required = true) val fat: kotlin.Int,

    @get:Min(value=0)
    @Schema(example = "null", required = true, description = "Carbohydrates in grams")
    @get:JsonProperty("carbs", required = true) val carbs: kotlin.Int
) {

}
