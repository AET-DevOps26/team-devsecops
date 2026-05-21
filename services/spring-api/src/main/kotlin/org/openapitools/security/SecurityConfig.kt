package org.openapitools.security

import org.openapitools.repository.UserRepository
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.MediaType
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter

@Configuration
class SecurityConfig(
	private val userRepository: UserRepository,
	private val jwtUtils: JwtUtils,
) {
	// BCrypt is the standard algorithm for hashing passwords
	@Bean
	fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

	// Tells Spring how to load a user by username — called during login to verify credentials
	@Bean
	fun userDetailsService(): UserDetailsService =
		UserDetailsService { username ->
			val user =
				userRepository
					.findByUsername(username)
					.orElseThrow { UsernameNotFoundException("User not found: $username") }
			User
				.withUsername(user.username)
				.password(user.password)
				.roles("USER")
				.build()
		}

	// The AuthenticationManager is what processes a login attempt (username + password check)
	@Bean
	fun authenticationManager(config: AuthenticationConfiguration): AuthenticationManager = config.authenticationManager

	@Bean
	fun filterChain(http: HttpSecurity): SecurityFilterChain {
		http
			.csrf { it.disable() } // not needed for stateless JWT APIs
			// Picks up the CorsConfigurationSource bean so preflights are answered
			// before the auth filter — without this, OPTIONS to protected endpoints
			// returns 403 and the browser reports a CORS error.
			.cors { }
			.sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
			.authorizeHttpRequests { auth ->
				auth
					.requestMatchers(
						"/api/v1/users/register",
						"/api/v1/users/login",
						"/h2-console/**",
						"/swagger-ui/**",
						"/v3/api-docs/**",
					).permitAll()
					.anyRequest()
					.authenticated() // all other routes require a valid JWT
			}.exceptionHandling { ex ->
				ex.authenticationEntryPoint { _, response, _ ->
					response.contentType = MediaType.APPLICATION_JSON_VALUE
					response.status = 401
					response.writer.write("""{"message":"Missing or invalid token"}""")
				}
				ex.accessDeniedHandler { _, response, _ ->
					response.contentType = MediaType.APPLICATION_JSON_VALUE
					response.status = 403
					response.writer.write("""{"message":"Access denied"}""")
				}
			}.headers { it.frameOptions { fo -> fo.disable() } } // needed for H2 console iframe
			.addFilterBefore(
				JwtAuthFilter(jwtUtils, userRepository),
				UsernamePasswordAuthenticationFilter::class.java,
			)
		return http.build()
	}
}
