package org.openapitools.config

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class JacksonConfig {
	// Spring Boot 4 no longer auto-registers ObjectMapper as a bean, so we do it explicitly.
	@Bean
	fun objectMapper(): ObjectMapper = ObjectMapper()
}
