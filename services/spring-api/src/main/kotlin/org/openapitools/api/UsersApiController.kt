package org.openapitools.api

import io.swagger.v3.oas.annotations.*
import io.swagger.v3.oas.annotations.enums.*
import io.swagger.v3.oas.annotations.media.*
import io.swagger.v3.oas.annotations.responses.*
import io.swagger.v3.oas.annotations.security.*
import jakarta.validation.Valid
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.openapitools.model.LoginRequest
import org.openapitools.model.RegisterRequest
import org.openapitools.model.UserProfile
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import org.springframework.web.context.request.NativeWebRequest
import kotlin.collections.List
import kotlin.collections.Map

@RestController
@Validated
@RequestMapping("\${api.base-path:/api/v1}")
class UsersApiController {
	@Operation(
		summary = "Login user and return JWT token",
		operationId = "usersLoginPost",
		description = """""",
		responses = [
			ApiResponse(responseCode = "200", description = "JWT token returned"),
		],
	)
	@RequestMapping(
		method = [RequestMethod.POST],
		// "/users/login"
		value = [PATH_USERS_LOGIN_POST],
		consumes = ["application/json"],
	)
	fun usersLoginPost(
		@Parameter(description = "", required = true) @Valid @RequestBody loginRequest: LoginRequest,
	): ResponseEntity<Unit> = ResponseEntity(HttpStatus.NOT_IMPLEMENTED)

	@Operation(
		summary = "Logout user and invalidate token",
		operationId = "usersLogoutPost",
		description = """""",
		responses = [
			ApiResponse(responseCode = "200", description = "Logged out"),
		],
		security = [ SecurityRequirement(name = "bearerAuth") ],
	)
	@RequestMapping(
		method = [RequestMethod.POST],
		// "/users/logout"
		value = [PATH_USERS_LOGOUT_POST],
	)
	fun usersLogoutPost(): ResponseEntity<Unit> = ResponseEntity(HttpStatus.NOT_IMPLEMENTED)

	@Operation(
		summary = "Get current user profile and preferences",
		operationId = "usersProfileGet",
		description = """""",
		responses = [
			ApiResponse(
				responseCode = "200",
				description = "User profile and preferences",
				content = [Content(schema = Schema(implementation = UserProfile::class))],
			),
		],
		security = [ SecurityRequirement(name = "bearerAuth") ],
	)
	@RequestMapping(
		method = [RequestMethod.GET],
		// "/users/profile"
		value = [PATH_USERS_PROFILE_GET],
		produces = ["application/json"],
	)
	fun usersProfileGet(): ResponseEntity<UserProfile> = ResponseEntity(HttpStatus.NOT_IMPLEMENTED)

	@Operation(
		summary = "Update user profile and preferences",
		operationId = "usersProfilePut",
		description = """""",
		responses = [
			ApiResponse(responseCode = "200", description = "Profile and preferences updated"),
		],
		security = [ SecurityRequirement(name = "bearerAuth") ],
	)
	@RequestMapping(
		method = [RequestMethod.PUT],
		// "/users/profile"
		value = [PATH_USERS_PROFILE_PUT],
		consumes = ["application/json"],
	)
	fun usersProfilePut(
		@Parameter(description = "", required = true) @Valid @RequestBody userProfile: UserProfile,
	): ResponseEntity<Unit> = ResponseEntity(HttpStatus.NOT_IMPLEMENTED)

	@Operation(
		summary = "Register a new user",
		operationId = "usersRegisterPost",
		description = """""",
		responses = [
			ApiResponse(responseCode = "201", description = "User created"),
		],
	)
	@RequestMapping(
		method = [RequestMethod.POST],
		// "/users/register"
		value = [PATH_USERS_REGISTER_POST],
		consumes = ["application/json"],
	)
	fun usersRegisterPost(
		@Parameter(description = "", required = true) @Valid @RequestBody registerRequest: RegisterRequest,
	): ResponseEntity<Unit> = ResponseEntity(HttpStatus.NOT_IMPLEMENTED)

	companion object {
		// for your own safety never directly reuse these path definitions in tests
		const val BASE_PATH: String = "/api/v1"
		const val PATH_USERS_LOGIN_POST: String = "/users/login"
		const val PATH_USERS_LOGOUT_POST: String = "/users/logout"
		const val PATH_USERS_PROFILE_GET: String = "/users/profile"
		const val PATH_USERS_PROFILE_PUT: String = "/users/profile"
		const val PATH_USERS_REGISTER_POST: String = "/users/register"
	}
}
