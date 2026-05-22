package org.openapitools.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.client.reactive.ReactorClientHttpConnector
import org.springframework.web.reactive.function.client.WebClient
import reactor.netty.http.client.HttpClient
import reactor.netty.resources.ConnectionProvider
import java.time.Duration
import org.springframework.web.reactive.function.client.ExchangeFilterFunction
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import java.nio.charset.StandardCharsets

@Configuration
class AiConfig {
	@Value("\${ai.recipe.service.url:http://localhost:8090}")
	private lateinit var aiRecipeServiceUrl: String

	@Value("\${ai.help.service.url:http://localhost:8091}")
	private lateinit var aiHelpServiceUrl: String

	@Value("\${ai.hmac.secret}")
    private lateinit var internalAuthSecret: String

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
			.filter(calculateAndAddHmacHeader()) // attach hmac signature filter
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
			.filter(calculateAndAddHmacHeader()) // attach hmac signature filter
			.build()
	}

	private fun calculateAndAddHmacHeader(): ExchangeFilterFunction {
		return object : ExchangeFilterFunction {
			override fun filter(
				request: org.springframework.web.reactive.function.client.ClientRequest,
				next: org.springframework.web.reactive.function.client.ExchangeFunction
			): reactor.core.publisher.Mono<org.springframework.web.reactive.function.client.ClientResponse> {
				
				val timestamp = (System.currentTimeMillis() / 1000L).toString()
				val signature = calculateHmacSha256(internalAuthSecret, timestamp)

				val authenticatedRequest = org.springframework.web.reactive.function.client.ClientRequest.from(request)
					.header("X-Internal-Timestamp", timestamp)
					.header("X-Internal-Signature", signature)
					.build()

				return next.exchange(authenticatedRequest)
			}
		}
	}

    private fun calculateHmacSha256(secret: String, data: String): String {
        try {
            val sha256HMAC = Mac.getInstance("HmacSHA256")
            val secretKeySpec = SecretKeySpec(secret.toByteArray(StandardCharsets.UTF_8), "HmacSHA256")
            sha256HMAC.init(secretKeySpec)
            val hashBytes = sha256HMAC.doFinal(data.toByteArray(StandardCharsets.UTF_8))
            
            return hashBytes.joinToString("") { "%02x".format(it) }
        } catch (e: Exception) {
            throw RuntimeException("Failed to generate internal HMAC authentication signature", e)
        }
    }
}
