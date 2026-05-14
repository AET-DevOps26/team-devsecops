package org.openapitools.config

import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class CorsConfig : WebMvcConfigurer {
	override fun addCorsMappings(registry: CorsRegistry) {
		registry.addMapping("/api/**")
			.allowedOriginPatterns(
				"https://aet-devops26.github.io",
        "http://localhost:8080",
				"https://*.team-devsecops.pages.dev",
			)
			.allowedMethods("POST")
	}
}
