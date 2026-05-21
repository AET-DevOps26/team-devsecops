package org.openapitools.model

import com.fasterxml.jackson.annotation.JsonProperty
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
import java.util.Objects

/**
 * Reusable field definitions for username and password constraints
 * @param username Alphanumeric, underscores, and hyphens only
 * @param password
 */
data class UserCredentials(
	@get:Pattern(regexp = "^[a-zA-Z0-9_-]+$")
	@get:Size(min = 1, max = 64)
	@Schema(example = "null", description = "Alphanumeric, underscores, and hyphens only")
	@get:JsonProperty("username") val username: kotlin.String? = null,
	@get:Size(min = 4, max = 128)
	@Schema(example = "null", description = "")
	@get:JsonProperty("password") val password: kotlin.String? = null,
)
