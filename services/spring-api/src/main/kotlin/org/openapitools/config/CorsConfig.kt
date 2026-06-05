package org.openapitools.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
class CorsConfig {
	// Exposing this as a bean (rather than via WebMvcConfigurer.addCorsMappings)
	// lets Spring Security's CorsFilter pick it up automatically, so preflight
	// OPTIONS requests get answered before the auth check runs.
	@Bean
	fun corsConfigurationSource(): CorsConfigurationSource {
		val config = CorsConfiguration().apply {
			allowedOriginPatterns = listOf("*")
			allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
			allowedHeaders = listOf("*")
		}
		return UrlBasedCorsConfigurationSource().apply {
			registerCorsConfiguration("/api/**", config)
		}
	}
}
