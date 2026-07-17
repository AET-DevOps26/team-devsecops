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
 * @param quantity
 * @param unit Unit of measurement (e.g. g, ml, cup, tbsp)
 * @param name
 */
data class RecipeIngredient(

    @get:DecimalMin(value="0")
    @Schema(example = "null", required = true, description = "")
    @get:JsonProperty("quantity", required = true) val quantity: kotlin.Double,

    @get:Size(min=1)
    @Schema(example = "null", required = true, description = "Unit of measurement (e.g. g, ml, cup, tbsp)")
    @get:JsonProperty("unit", required = true) val unit: kotlin.String,

    @get:Size(min=1)
    @Schema(example = "null", required = true, description = "")
    @get:JsonProperty("name", required = true) val name: kotlin.String
) {

}
