package org.openapitools.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.openapitools.repository.TokenBlocklistRepository
import org.openapitools.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.User
import org.springframework.web.filter.OncePerRequestFilter

class JwtAuthFilter(
	private val jwtUtils: JwtUtils,
	private val userRepository: UserRepository,
	private val tokenBlocklist: TokenBlocklistRepository,
) : OncePerRequestFilter() {
	private val log = LoggerFactory.getLogger(javaClass)

	override fun doFilterInternal(
		request: HttpServletRequest,
		response: HttpServletResponse,
		filterChain: FilterChain,
	) {
		val header = request.getHeader("Authorization")
		if (header != null && header.startsWith("Bearer ")) {
			val token = header.removePrefix("Bearer ")
			when {
				!jwtUtils.validateToken(token) -> {
					log.warn("Rejected invalid JWT [path={}]", request.requestURI)
				}

				tokenBlocklist.existsById(jwtUtils.tokenHash(token)) -> {
					log.warn("Rejected invalidated JWT [path={}]", request.requestURI)
				}

				else -> {
					val userId = jwtUtils.getUserIdFromToken(token)
					userRepository.findById(userId).ifPresent { entity ->
						val userDetails =
							User
								.withUsername(entity.username)
								.password(entity.password)
								.roles("USER")
								.build()
						// Store the raw token as credentials so logout can retrieve and blocklist it.
						val auth = UsernamePasswordAuthenticationToken(userDetails, token, userDetails.authorities)
						SecurityContextHolder.getContext().authentication = auth
					}
				}
			}
		}
		filterChain.doFilter(request, response)
	}

	// set to false to avoid controller 500s being masked as 401
	override fun shouldNotFilterErrorDispatch(): Boolean = false
}
