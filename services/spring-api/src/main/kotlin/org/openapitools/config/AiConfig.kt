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
            .filter(calculateAndAddHmacHeader()) 
            .build()
    }

    @Bean
    fun aiHelpWebClient(): WebClient {
        val pool =
            ConnectionProvider
                .builder("ai")
                .maxIdleTime(Duration.ofSeconds(2))
                .build()
        return WebClient
            .builder()
            .baseUrl(aiHelpServiceUrl)
            .clientConnector(ReactorClientHttpConnector(HttpClient.create(pool)))
            .filter(calculateAndAddHmacHeader()) 
            .build()
    }

    private fun calculateAndAddHmacHeader(): ExchangeFilterFunction {
        return ExchangeFilterFunction { request, next ->
            val timestamp = (System.currentTimeMillis() / 1000L).toString()
            
            // 1. Generate an empty-body baseline signature as a fallback
            val fallbackData = "$timestamp."
            val fallbackSignature = calculateHmacSha256(internalAuthSecret, fallbackData)

            // 2. Attach timestamp and baseline signature up front
            val requestWithFallback = org.springframework.web.reactive.function.client.ClientRequest.from(request)
                .header("X-Internal-Timestamp", timestamp)
                .header("X-Internal-Signature", fallbackSignature)
                .build()

            val method = requestWithFallback.method()

            // 3. For GET, HEAD, or OPTIONS requests, no body will ever exist. Ship it immediately.
            if (method == org.springframework.http.HttpMethod.GET || 
                method == org.springframework.http.HttpMethod.HEAD || 
                method == org.springframework.http.HttpMethod.OPTIONS) {
                return@ExchangeFilterFunction next.exchange(requestWithFallback)
            }

            // 4. For payload-bearing requests (POST/PUT), intercept the serialization stream
            val authenticatedRequest = org.springframework.web.reactive.function.client.ClientRequest.from(requestWithFallback)
                .body { outputMessage, context ->
                    val bodyDecorator = object : org.springframework.http.client.reactive.ClientHttpRequestDecorator(outputMessage) {
                        override fun writeWith(body: org.reactivestreams.Publisher<out org.springframework.core.io.buffer.DataBuffer>): reactor.core.publisher.Mono<Void> {
                            return org.springframework.core.io.buffer.DataBufferUtils.join(body)
                                .flatMap { dataBuffer ->
                                    // Extract the raw bytes exactly as they will be sent over the wire
                                    val bytes = ByteArray(dataBuffer.readableByteCount())
                                    dataBuffer.read(bytes)
                                    org.springframework.core.io.buffer.DataBufferUtils.release(dataBuffer)

                                    val payloadString = String(bytes, java.nio.charset.StandardCharsets.UTF_8)
                                    val dataToSign = "$timestamp.$payloadString"
                                    val signature = calculateHmacSha256(internalAuthSecret, dataToSign)

                                    // Dynamically overwrite the baseline signature header with the real payload signature
                                    this.headers.set("X-Internal-Signature", signature)

                                    // Re-wrap the bytes into a new data buffer so the request chain can proceed natively
                                    val factory = this.delegate.bufferFactory()
                                    val newBuffer = factory.wrap(bytes)
                                    super.writeWith(reactor.core.publisher.Mono.just(newBuffer))
                                }
                                .switchIfEmpty(reactor.core.publisher.Mono.defer {
                                    // Fallback if a POST/PUT body stream happens to be completely empty
                                    super.writeWith(body)
                                })
                        }
                    }
                    request.body().insert(bodyDecorator, context)
                }.build()

            next.exchange(authenticatedRequest)
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