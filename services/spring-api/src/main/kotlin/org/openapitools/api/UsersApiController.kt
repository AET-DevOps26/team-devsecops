package org.openapitools.api

import com.fasterxml.jackson.databind.ObjectMapper
import io.swagger.v3.oas.annotations.*
import io.swagger.v3.oas.annotations.enums.*
import io.swagger.v3.oas.annotations.media.*
import io.swagger.v3.oas.annotations.responses.*
import io.swagger.v3.oas.annotations.security.*
import jakarta.validation.Valid
import org.openapitools.entity.UserEntity
import org.openapitools.model.LoginRequest
import org.openapitools.model.RegisterRequest
import org.openapitools.model.UserPreferences
import org.openapitools.model.UserProfile
import org.openapitools.model.UserProfileUpdate
import org.openapitools.repository.UserRepository
import org.openapitools.security.JwtUtils
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*

@RestController
@Validated
@RequestMapping("\${api.base-path:/api/v1}")
class UsersApiController(
	private val userRepository: UserRepository,
	private val passwordEncoder: PasswordEncoder,
	private val authManager: AuthenticationManager,
	private val jwtUtils: JwtUtils,
	private val objectMapper: ObjectMapper,
) {
	@Operation(
		summary = "Register a new user",
		operationId = "usersRegisterPost",
		responses = [ApiResponse(responseCode = "201", description = "User created")],
	)
	@RequestMapping(method = [RequestMethod.POST], value = [PATH_USERS_REGISTER_POST], consumes = ["application/json"])
	fun usersRegisterPost(
		@Parameter(description = "", required = true) @Valid @RequestBody registerRequest: RegisterRequest,
	): ResponseEntity<Unit> {
		if (userRepository.existsByUsername(registerRequest.username)) {
			return ResponseEntity(HttpStatus.CONFLICT)
		}
		userRepository.save(
			UserEntity(
				username = registerRequest.username,
				password = passwordEncoder.encode(registerRequest.password)!!,
				preferences = objectMapper.writeValueAsString(UserPreferences()),
			),
		)
		return ResponseEntity(HttpStatus.CREATED)
	}

	@Operation(
		summary = "Login user and return JWT token",
		operationId = "usersLoginPost",
		responses = [ApiResponse(responseCode = "200", description = "JWT token returned")],
	)
	@RequestMapping(method = [RequestMethod.POST], value = [PATH_USERS_LOGIN_POST], consumes = ["application/json"])
	fun usersLoginPost(
		@Parameter(description = "", required = true) @Valid @RequestBody loginRequest: LoginRequest,
	): ResponseEntity<Map<String, String>> =
		try {
			val auth =
				authManager.authenticate(
					UsernamePasswordAuthenticationToken(loginRequest.username, loginRequest.password),
				)
			ResponseEntity.ok(mapOf("token" to jwtUtils.generateToken(auth.name)))
		} catch (e: BadCredentialsException) {
			ResponseEntity(HttpStatus.UNAUTHORIZED)
		}

	@Operation(
		summary = "Logout user and invalidate token",
		operationId = "usersLogoutPost",
		responses = [ApiResponse(responseCode = "200", description = "Logged out")],
		security = [SecurityRequirement(name = "bearerAuth")],
	)
	@RequestMapping(method = [RequestMethod.POST], value = [PATH_USERS_LOGOUT_POST])
	fun usersLogoutPost(): ResponseEntity<Unit> =
		// JWTs are stateless — the client simply discards the token.
		// For true server-side invalidation you'd need a token blocklist (e.g. Redis).
		ResponseEntity(HttpStatus.OK)

	@Operation(
		summary = "Get current user profile and preferences",
		operationId = "usersProfileGet",
		responses = [
			ApiResponse(
				responseCode = "200",
				description = "User profile and preferences",
				content = [Content(schema = Schema(implementation = UserProfile::class))],
			),
		],
		security = [SecurityRequirement(name = "bearerAuth")],
	)
	@RequestMapping(method = [RequestMethod.GET], value = [PATH_USERS_PROFILE_GET], produces = ["application/json"])
	fun usersProfileGet(
		@AuthenticationPrincipal principal: UserDetails,
	): ResponseEntity<UserProfile> {
		val user = userRepository.findByUsername(principal.username).orElseThrow()
		val prefs =
			user.preferences?.let {
				objectMapper.readValue(it, UserPreferences::class.java)
			} ?: UserPreferences()
		return ResponseEntity.ok(
			UserProfile(username = user.username, preferences = prefs),
		)
	}

	@Operation(
		summary = "Update user profile and preferences",
		operationId = "usersProfilePut",
		responses = [ApiResponse(responseCode = "200", description = "Profile and preferences updated")],
		security = [SecurityRequirement(name = "bearerAuth")],
	)
	@RequestMapping(method = [RequestMethod.PUT], value = [PATH_USERS_PROFILE_PUT], consumes = ["application/json"])
	fun usersProfilePut(
		@Parameter(description = "", required = true) @Valid @RequestBody userProfile: UserProfileUpdate,
		@AuthenticationPrincipal principal: UserDetails,
	): ResponseEntity<Unit> {
		val user = userRepository.findByUsername(principal.username).orElseThrow()
		userProfile.preferences?.let { user.preferences = objectMapper.writeValueAsString(it) }
		userProfile.username?.let { user.username = it }
		userProfile.password?.let { user.password = passwordEncoder.encode(it)!! }
		userRepository.save(user)
		return ResponseEntity(HttpStatus.OK)
	}

	companion object {
		const val BASE_PATH: String = "/api/v1"
		const val PATH_USERS_LOGIN_POST: String = "/users/login"
		const val PATH_USERS_LOGOUT_POST: String = "/users/logout"
		const val PATH_USERS_PROFILE_GET: String = "/users/profile"
		const val PATH_USERS_PROFILE_PUT: String = "/users/profile"
		const val PATH_USERS_REGISTER_POST: String = "/users/register"
	}
}
