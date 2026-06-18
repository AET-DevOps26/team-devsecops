package org.openapitools.api

import jakarta.validation.Valid
import org.openapitools.entity.TokenBlocklistEntry
import org.openapitools.entity.UserEntity
import org.openapitools.model.AuthRequest
import org.openapitools.model.AuthResponse
import org.openapitools.model.UserPreferences
import org.openapitools.model.UserProfile
import org.openapitools.model.UserProfileUpdate
import org.openapitools.repository.TokenBlocklistRepository
import org.openapitools.repository.UserRepository
import org.openapitools.security.JwtUtils
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import tools.jackson.databind.ObjectMapper

@RestController
@Validated
@RequestMapping("\${api.base-path:/api/v1}")
class UsersApiController(
	private val userRepository: UserRepository,
	private val passwordEncoder: PasswordEncoder,
	private val authManager: AuthenticationManager,
	private val jwtUtils: JwtUtils,
	private val objectMapper: ObjectMapper,
	private val tokenBlocklist: TokenBlocklistRepository,
) : UsersApi {
	override fun usersRegisterPost(
		@Valid authRequest: AuthRequest,
	): ResponseEntity<Unit> {
		if (userRepository.existsByUsername(authRequest.username)) {
			throw ConflictException("Username already taken")
		}
		userRepository.save(
			UserEntity(
				username = authRequest.username,
				password = passwordEncoder.encode(authRequest.password)!!,
				preferences = objectMapper.writeValueAsString(UserPreferences()),
			),
		)
		return ResponseEntity(HttpStatus.CREATED)
	}

	override fun usersLoginPost(
		@Valid authRequest: AuthRequest,
	): ResponseEntity<AuthResponse> {
		try {
			authManager.authenticate(
				UsernamePasswordAuthenticationToken(authRequest.username, authRequest.password),
			)
		} catch (e: BadCredentialsException) {
			throw UnauthorizedException("Invalid username or password")
		}
		val user = userRepository.findByUsername(authRequest.username).orElseThrow()
		return ResponseEntity.ok(AuthResponse(token = jwtUtils.generateToken(user.id)))
	}

	override fun usersLogoutPost(): ResponseEntity<Unit> {
		val token = SecurityContextHolder.getContext().authentication?.credentials as? String
		if (token != null) {
			tokenBlocklist.save(
				TokenBlocklistEntry(
					tokenHash = jwtUtils.tokenHash(token),
					expiresAt = jwtUtils.getExpirationFromToken(token),
				),
			)
		}
		return ResponseEntity(HttpStatus.OK)
	}

	override fun usersProfileGet(): ResponseEntity<UserProfile> {
		val user = userRepository.findByUsername(currentUsername()).orElseThrow()
		val prefs =
			user.preferences?.let {
				objectMapper.readValue(it, UserPreferences::class.java)
			} ?: UserPreferences()
		return ResponseEntity.ok(UserProfile(username = user.username, preferences = prefs))
	}

	override fun usersProfilePut(
		@Valid userProfileUpdate: UserProfileUpdate,
	): ResponseEntity<Unit> {
		val user = userRepository.findByUsername(currentUsername()).orElseThrow()
		userProfileUpdate.preferences?.let { user.preferences = objectMapper.writeValueAsString(it) }
		userProfileUpdate.username?.let { newUsername ->
			if (newUsername != user.username && userRepository.existsByUsername(newUsername)) {
				throw ConflictException("Username already taken")
			}
			user.username = newUsername
		}
		userProfileUpdate.password?.let { user.password = passwordEncoder.encode(it)!! }
		userRepository.save(user)
		return ResponseEntity(HttpStatus.OK)
	}

	override fun usersProfileDelete(): ResponseEntity<Unit> {
		val user = userRepository.findByUsername(currentUsername()).orElseThrow()
		userRepository.delete(user)
		return ResponseEntity(HttpStatus.NO_CONTENT)
	}

	private fun currentUsername(): String = SecurityContextHolder.getContext().authentication!!.name
}
