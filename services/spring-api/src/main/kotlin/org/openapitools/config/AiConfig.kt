package org.openapitools.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.client.reactive.ReactorClientHttpConnector
import org.springframework.web.reactive.function.client.WebClient
import reactor.netty.http.client.HttpClient
import reactor.netty.resources.ConnectionProvider
import java.time.Duration

@Configuration
class AiConfig {
	@Value("\${ai.recipe.service.url:http://localhost:8090}")
	private lateinit var aiRecipeServiceUrl: String

	@Value("\${ai.help.service.url:http://localhost:8091}")
	private lateinit var aiHelpServiceUrl: String

	@Bean
	fun aiRecipeWebClient(): WebClient {
		val pool =
			ConnectionProvider
				.builder("recipe")
				.maxIdleTime(Duration.ofSeconds(2))
				.build()
		return WebClient
			.builder()
			.baseUrl(aiRecipeServiceUrl)
			.clientConnector(ReactorClientHttpConnector(HttpClient.create(pool)))
			.build()
	}

	@Bean
	fun aiHelpWebClient(): WebClient {
		val pool =
			ConnectionProvider
				.builder("ai")
				// maxIdleTime must stay below uvicorn's --timeout-keep-alive (default 5s). Otherwise, it sometimes happens
				// that we try to reuse an existing connection because a new request comes in within >5s, but uvicorn
				// already discarded the connection.
				.maxIdleTime(Duration.ofSeconds(2))
				.build()
		return WebClient
			.builder()
			.baseUrl(aiHelpServiceUrl)
			.clientConnector(ReactorClientHttpConnector(HttpClient.create(pool)))
			.build()
	}
}
