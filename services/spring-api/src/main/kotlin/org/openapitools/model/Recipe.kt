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
 *
 * @param title
 * @param ingredients
 * @param instructions
 * @param portions
 * @param id
 * @param createdAt When the recipe was saved (UTC)
 * @param editedAt When the recipe was last edited (UTC)
 * @param nutrients
 * @param openedAt When the recipe was last opened (UTC)
 */
data class Recipe(

    @get:Size(min=1,max=255)
    @Schema(example = "null", required = true, description = "")
    @get:JsonProperty("title", required = true) val title: kotlin.String,

    @field:Valid
    @get:Size(min=1)
    @Schema(example = "null", required = true, description = "")
    @get:JsonProperty("ingredients", required = true) val ingredients: kotlin.collections.List<RecipeIngredient>,

    @get:Size(min=1)
    @Schema(example = "null", required = true, description = "")
    @get:JsonProperty("instructions", required = true) val instructions: kotlin.collections.List<kotlin.String>,

    @get:DecimalMin(value="0.5")
    @Schema(example = "null", required = true, description = "")
    @get:JsonProperty("portions", required = true) val portions: kotlin.Double,

    @get:Min(value=1L)
    @Schema(example = "null", required = true, description = "")
    @get:JsonProperty("id", required = true) val id: kotlin.Long,

    @Schema(example = "null", required = true, description = "When the recipe was saved (UTC)")
    @get:JsonProperty("createdAt", required = true) val createdAt: java.time.OffsetDateTime,

    @Schema(example = "null", required = true, description = "When the recipe was last edited (UTC)")
    @get:JsonProperty("editedAt", required = true) val editedAt: java.time.OffsetDateTime,

    @field:Valid
    @Schema(example = "null", description = "")
    @get:JsonProperty("nutrients") val nutrients: RecipeNutrients? = null,

    @Schema(example = "null", description = "When the recipe was last opened (UTC)")
    @get:JsonProperty("openedAt") val openedAt: java.time.OffsetDateTime? = null
) {

}
