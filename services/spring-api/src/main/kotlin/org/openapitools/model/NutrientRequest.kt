package org.openapitools.model

import java.util.Objects
import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonValue
import org.openapitools.model.Language
import org.openapitools.model.RecipeInput
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
 * @param recipe
 * @param language Optional active language context for any generated metadata text
 */
data class NutrientRequest(

    @field:Valid
    @Schema(example = "null", required = true, description = "")
    @get:JsonProperty("recipe", required = true) val recipe: RecipeInput,

    @field:Valid
    @Schema(example = "null", description = "Optional active language context for any generated metadata text")
    @get:JsonProperty("language") val language: Language? = null
) {

}
