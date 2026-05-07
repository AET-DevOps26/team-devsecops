package org.openapitools.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.reactive.function.client.WebClient

@Configuration
class AiConfig {
	@Bean
	fun aiWebClient(): WebClient =
		WebClient
			.builder()
			.baseUrl("http://localhost:8000")
			.build()
}
