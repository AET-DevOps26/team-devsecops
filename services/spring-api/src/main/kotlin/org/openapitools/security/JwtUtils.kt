package org.openapitools.security

import io.jsonwebtoken.JwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.security.MessageDigest
import java.time.Instant
import java.util.Date

@Component
class JwtUtils {
	@Value("\${app.jwt.secret}")
	private lateinit var jwtSecret: String

	@Value("\${app.jwt.expiration-ms}")
	private var jwtExpirationMs: Long = 0

	private fun key() = Keys.hmacShaKeyFor(jwtSecret.toByteArray())

	fun generateToken(userId: Long): String =
		Jwts
			.builder()
			.subject(userId.toString())
			.issuedAt(Date())
			.expiration(Date(System.currentTimeMillis() + jwtExpirationMs))
			.signWith(key())
			.compact()

	fun getUserIdFromToken(token: String): Long =
		Jwts
			.parser()
			.verifyWith(key())
			.build()
			.parseSignedClaims(token)
			.payload.subject
			.toLong()

	fun validateToken(token: String): Boolean =
		try {
			Jwts
				.parser()
				.verifyWith(key())
				.build()
				.parseSignedClaims(token)
			true
		} catch (e: JwtException) {
			false
		}

	fun getExpirationFromToken(token: String): Instant =
		Jwts
			.parser()
			.verifyWith(key())
			.build()
			.parseSignedClaims(token)
			.payload.expiration
			.toInstant()

	fun tokenHash(token: String): String {
		val bytes = MessageDigest.getInstance("SHA-256").digest(token.toByteArray())
		return bytes.joinToString("") { "%02x".format(it) }
	}
}
