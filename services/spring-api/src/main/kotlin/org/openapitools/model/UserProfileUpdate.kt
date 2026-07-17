package org.openapitools.model

import java.util.Objects
import com.fasterxml.jackson.annotation.JsonProperty
import org.openapitools.model.UserPreferences
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
 * @param username Alphanumeric, underscores, hyphens, and dots only
 * @param password
 * @param preferences
 */
data class UserProfileUpdate(

    @get:Pattern(regexp="^[a-zA-Z0-9_.-]+$")
    @get:Size(min=1,max=64)
    @Schema(example = "null", description = "Alphanumeric, underscores, hyphens, and dots only")
    @get:JsonProperty("username") val username: kotlin.String? = null,

    @get:Size(min=4,max=128)
    @Schema(example = "null", description = "")
    @get:JsonProperty("password") val password: kotlin.String? = null,

    @field:Valid
    @Schema(example = "null", description = "")
    @get:JsonProperty("preferences") val preferences: UserPreferences? = null
) {

}
