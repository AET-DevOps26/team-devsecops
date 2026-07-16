package org.openapitools.config

import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import io.opentelemetry.api.OpenTelemetry
import io.opentelemetry.context.Context
import okhttp3.ConnectionPool
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import org.openapitools.internal.client.HelpServiceApi
import org.openapitools.internal.client.RecipeServiceApi
import org.openapitools.security.InternalHmacInterceptor
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit

private class TracePropagationInterceptor(
	private val openTelemetry: OpenTelemetry,
) : Interceptor {
	override fun intercept(chain: Interceptor.Chain): Response {
		val builder = chain.request().newBuilder()
		openTelemetry.propagators.textMapPropagator.inject(Context.current(), builder) { b, key, value ->
			b!!.header(key, value)
		}
		return chain.proceed(builder.build())
	}
}

@Configuration
class AiConfig(
	private val openTelemetry: OpenTelemetry,
) {
	@Value("\${ai.recipe.service.url:http://localhost:8090}")
	private lateinit var aiRecipeServiceUrl: String

	@Value("\${ai.help.service.url:http://localhost:8091}")
	private lateinit var aiHelpServiceUrl: String

	@Value("\${ai.hmac.secret}")
	private lateinit var internalAuthSecret: String

	private fun createBaseHttpClient(): OkHttpClient =
		OkHttpClient
			.Builder()
			.connectionPool(ConnectionPool(5, 2, TimeUnit.SECONDS))
			.readTimeout(60, TimeUnit.SECONDS) // Time allowed for Python to process and stream back data
			.callTimeout(60, TimeUnit.SECONDS)
			.addInterceptor(TracePropagationInterceptor(openTelemetry))
			.addInterceptor(InternalHmacInterceptor(internalAuthSecret))
			.build()

	private val moshi =
		Moshi
			.Builder()
			.addLast(KotlinJsonAdapterFactory())
			.build()

	@Bean
	fun aiHelpServiceApi(): HelpServiceApi {
		val retrofit =
			Retrofit
				.Builder()
				.baseUrl(aiHelpServiceUrl.let { if (it.endsWith("/")) it else "$it/" })
				.client(createBaseHttpClient())
				.addConverterFactory(MoshiConverterFactory.create(moshi))
				.build()

		return retrofit.create(HelpServiceApi::class.java)
	}

	@Bean
	fun aiRecipeServiceApi(): RecipeServiceApi {
		val retrofit =
			Retrofit
				.Builder()
				.baseUrl(aiRecipeServiceUrl.let { if (it.endsWith("/")) it else "$it/" })
				.client(createBaseHttpClient())
				.addConverterFactory(MoshiConverterFactory.create(moshi))
				.build()

		return retrofit.create(RecipeServiceApi::class.java)
	}
}
