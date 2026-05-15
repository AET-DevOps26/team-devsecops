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
			allowedOriginPatterns = listOf(
				"https://aet-devops26.github.io",
				"http://localhost:8080",
				"http://127.0.0.1:8080",
				"http://0.0.0.0:8080",
				"https://*.team-devsecops.pages.dev",
			)
			allowedMethods = listOf("GET", "POST", "PUT")
			allowedHeaders = listOf("*")
		}
		return UrlBasedCorsConfigurationSource().apply {
			registerCorsConfiguration("/api/**", config)
		}
	}
}
