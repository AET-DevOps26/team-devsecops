package org.openapitools.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.openapitools.repository.UserRepository
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.User
import org.springframework.web.filter.OncePerRequestFilter

// Runs on every incoming request and checks the Authorization header for a valid JWT.
// If valid, it marks the request as authenticated so Spring Security lets it through.
class JwtAuthFilter(
	private val jwtUtils: JwtUtils,
	private val userRepository: UserRepository,
) : OncePerRequestFilter() {

	override fun doFilterInternal(
		request: HttpServletRequest,
		response: HttpServletResponse,
		filterChain: FilterChain,
	) {
		// Expects: Authorization: Bearer <token>
		val header = request.getHeader("Authorization")
		if (header != null && header.startsWith("Bearer ")) {
			val token = header.removePrefix("Bearer ")
			if (jwtUtils.validateToken(token)) {
				val userId = jwtUtils.getUserIdFromToken(token)
				userRepository.findById(userId).ifPresent { entity ->
					val userDetails = User.withUsername(entity.username).password(entity.password).roles("USER").build()
					val auth = UsernamePasswordAuthenticationToken(userDetails, null, userDetails.authorities)
					SecurityContextHolder.getContext().authentication = auth
				}
			}
		}
		filterChain.doFilter(request, response)
	}
}
