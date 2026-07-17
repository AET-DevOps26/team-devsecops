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
 * A measured ingredient has both quantity and unit (\"200 g flour\"); a counted one has a quantity only (\"2 eggs\"); one added to taste has neither (\"salt\"). A unit without a quantity is meaningless and is rejected by the recipe editor, though the contract tolerates it.
 * @param name
 * @param quantity Amount of the ingredient. Omitted when the ingredient is added to taste.
 * @param unit Unit of measurement (e.g. g, ml, cup, tbsp). Omitted when the ingredient is counted as whole items rather than measured.
 */
data class RecipeIngredient(

    @get:Size(min=1)
    @Schema(example = "null", required = true, description = "")
    @get:JsonProperty("name", required = true) val name: kotlin.String,

    @get:DecimalMin(value="0")
    @Schema(example = "null", description = "Amount of the ingredient. Omitted when the ingredient is added to taste.")
    @get:JsonProperty("quantity") val quantity: kotlin.Double? = null,

    @get:Size(min=1)
    @Schema(example = "null", description = "Unit of measurement (e.g. g, ml, cup, tbsp). Omitted when the ingredient is counted as whole items rather than measured.")
    @get:JsonProperty("unit") val unit: kotlin.String? = null
) {

}
