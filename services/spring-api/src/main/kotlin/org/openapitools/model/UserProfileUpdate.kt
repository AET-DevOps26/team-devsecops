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
 * @param password
 * @param preferences
 */
data class UserProfileUpdate(
	@Schema(example = "null", description = "")
	@get:JsonProperty("username") val username: kotlin.String? = null,
	@Schema(example = "null", description = "")
	@get:JsonProperty("password") val password: kotlin.String? = null,
	@field:Valid
	@Schema(example = "null", description = "")
	@get:JsonProperty("preferences") val preferences: UserPreferences? = null,
)
