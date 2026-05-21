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
import org.openapitools.model.UserPreferences
import java.util.Objects

/**
 * At least one field must be provided
 * @param username Alphanumeric, underscores, and hyphens only
 * @param password
 * @param preferences
 */
data class UserProfileUpdate(
	@get:Pattern(regexp = "^[a-zA-Z0-9_-]+$")
	@get:Size(min = 1, max = 64)
	@Schema(example = "null", required = true, description = "Alphanumeric, underscores, and hyphens only")
	@get:JsonProperty("username", required = true) val username: kotlin.String,
	@get:Size(min = 4, max = 128)
	@Schema(example = "null", required = true, description = "")
	@get:JsonProperty("password", required = true) val password: kotlin.String,
	@field:Valid
	@Schema(example = "null", description = "")
	@get:JsonProperty("preferences") val preferences: UserPreferences? = null,
)
