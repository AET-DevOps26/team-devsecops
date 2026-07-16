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
 * Reusable field definitions for username and password constraints
 * @param username Alphanumeric, underscores, hyphens, and dots only
 * @param password
 */
data class UserCredentials(

    @get:Pattern(regexp="^[a-zA-Z0-9_.-]+$")
    @get:Size(min=1,max=64)
    @Schema(example = "null", description = "Alphanumeric, underscores, hyphens, and dots only")
    @get:JsonProperty("username") val username: kotlin.String? = null,

    @get:Size(min=4,max=128)
    @Schema(example = "null", description = "")
    @get:JsonProperty("password") val password: kotlin.String? = null
) {

}
