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
 *
 * @param username
 * @param password
 */
data class LoginRequest(
	@Schema(example = "null", required = true, description = "")
	@get:JsonProperty("username", required = true) val username: kotlin.String,
	@Schema(example = "null", required = true, description = "")
	@get:JsonProperty("password", required = true) val password: kotlin.String,
)
