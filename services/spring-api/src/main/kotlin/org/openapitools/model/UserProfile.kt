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
 *
 * @param username
 * @param preferences
 */
data class UserProfile(
	@get:Size(min = 1)
	@Schema(example = "null", required = true, description = "")
	@get:JsonProperty("username", required = true) val username: kotlin.String,
	@field:Valid
	@Schema(example = "null", required = true, description = "")
	@get:JsonProperty("preferences", required = true) val preferences: UserPreferences,
)
