package org.openapitools.model

import java.util.Objects
import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonValue
import org.openapitools.model.Language
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
 * @param prompt
 * @param language Active UI language; generated recipe content is written in it
 */
data class RecipeRequest(

    @get:Size(min=1,max=4096)
    @Schema(example = "null", required = true, description = "")
    @get:JsonProperty("prompt", required = true) val prompt: kotlin.String,

    @field:Valid
    @Schema(example = "null", description = "Active UI language; generated recipe content is written in it")
    @get:JsonProperty("language") val language: Language? = null
) {

}
