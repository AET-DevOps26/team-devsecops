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
import org.openapitools.model.UserProfilePreferences
import java.util.Objects

/**
 *
 * @param id
 * @param username
 * @param password
 * @param preferences
 */
data class UserProfile(
	@Schema(example = "null", required = true, description = "")
	@get:JsonProperty("id", required = true) val id: kotlin.String,
	@Schema(example = "null", description = "")
	@get:JsonProperty("username") val username: kotlin.String? = null,
	@Schema(example = "null", description = "")
	@get:JsonProperty("password") val password: kotlin.String? = null,
	@field:Valid
	@Schema(example = "null", description = "")
	@get:JsonProperty("preferences") val preferences: UserProfilePreferences? = null,
)
