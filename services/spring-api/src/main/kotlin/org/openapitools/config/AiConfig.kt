package org.openapitools.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.client.reactive.ReactorClientHttpConnector
import org.springframework.web.reactive.function.client.WebClient
import reactor.netty.http.client.HttpClient
import reactor.netty.resources.ConnectionProvider
import java.time.Duration

@Configuration
class AiConfig {
	@Bean
	fun aiWebClient(): WebClient {
		val pool = ConnectionProvider.builder("ai")
			// maxIdleTime must stay below uvicorn's --timeout-keep-alive (default 5s). Otherwise, it sometimes happens
			// that we try to reuse an existing connection because a new request comes in within >5s, but uvicorn
			// already discarded the connection.
			.maxIdleTime(Duration.ofSeconds(2))
			.build()
		return WebClient
			.builder()
			.baseUrl("http://localhost:8081")
			.clientConnector(ReactorClientHttpConnector(HttpClient.create(pool)))
			.build()
	}
}
