package org.openapitools.config

import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class CorsConfig : WebMvcConfigurer {
	override fun addCorsMappings(registry: CorsRegistry) {
		registry.addMapping("/api/**")
			.allowedOrigins("https://aet-devops26.github.io", "http://localhost:8000")
			.allowedMethods("POST")
	}
}
