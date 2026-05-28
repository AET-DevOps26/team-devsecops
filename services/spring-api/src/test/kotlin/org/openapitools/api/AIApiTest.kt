package org.openapitools.api

import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.Arguments
import org.junit.jupiter.params.provider.MethodSource
import org.mockito.Mockito
import org.mockito.kotlin.any
import org.mockito.kotlin.whenever
import org.openapitools.model.HelpResponse
import org.openapitools.model.RecipeIngredient
import org.openapitools.model.RecipeInput
import org.openapitools.model.RecipeNutrients
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Import
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono
import java.math.BigDecimal

@Import(AIApiTest.MockWebClients::class)
class AIApiTest : ApiTestBase() {
	// Provides deep-stub WebClient mocks so the full fluent chain can be stubbed
	@TestConfiguration
	class MockWebClients {
		val helpClient: WebClient = Mockito.mock(WebClient::class.java, Mockito.RETURNS_DEEP_STUBS)
		val recipeClient: WebClient = Mockito.mock(WebClient::class.java, Mockito.RETURNS_DEEP_STUBS)

		@Bean fun aiHelpWebClient(): WebClient = helpClient

		@Bean fun aiRecipeWebClient(): WebClient = recipeClient
	}

	@Autowired lateinit var mockWebClients: MockWebClients

	@BeforeEach
	fun resetMocks() {
		Mockito.reset(mockWebClients.helpClient, mockWebClients.recipeClient)
	}

	private fun stubHelpClient(response: Mono<HelpResponse>) {
		@Suppress("UNCHECKED_CAST")
		whenever(
			mockWebClients.helpClient
				.post()
				.uri("/ai/help")
				.contentType(any())
				.bodyValue(any())
				.retrieve()
				.bodyToMono(HelpResponse::class.java),
		).thenReturn(response)
	}

	private fun stubRecipeClient(response: Mono<List<RecipeInput>>) {
		@Suppress("UNCHECKED_CAST")
		whenever(
			mockWebClients.recipeClient
				.post()
				.uri("/ai/recipes")
				.contentType(any())
				.bodyValue(any())
				.retrieve()
				.bodyToMono(any<ParameterizedTypeReference<List<RecipeInput>>>()),
		).thenReturn(response)
	}

	private val sampleRecipeInput =
		RecipeInput(
			title = "AI Pasta",
			ingredients = listOf(RecipeIngredient(quantity = BigDecimal("200"), unit = "g", name = "pasta")),
			instructions = listOf("Boil water", "Cook pasta"),
			portions = BigDecimal("2"),
			nutrients = RecipeNutrients(calories = 400, protein = 12, fat = 2, carbs = 70),
		)

	// --- POST /ai/help ---

	@Test
	fun `ai help - returns 200 with AI response`() {
		val token = register()
		stubHelpClient(Mono.just(HelpResponse("Try adding more salt.")))
		mockMvc
			.perform(
				post("/api/v1/ai/help")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content(
						"""{"recipe":{"title":"Pasta","ingredients":[{"quantity":200,"unit":"g","name":"pasta"}],"instructions":["Cook"],"portions":2},"prompt":"How do I improve this?"}""",
					),
			).andExpect(status().isOk)
			.andExpect(jsonPath("$.response").value("Try adding more salt."))
	}

	@Test
	fun `ai help - service returns null returns 502`() {
		val token = register()
		stubHelpClient(Mono.empty())
		mockMvc
			.perform(
				post("/api/v1/ai/help")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content(
						"""{"recipe":{"title":"Pasta","ingredients":[{"quantity":200,"unit":"g","name":"pasta"}],"instructions":["Cook"],"portions":2},"prompt":"Help?"}""",
					),
			).andExpect(status().isBadGateway)
			.andExpect(jsonPath("$.message").exists())
	}

	@Test
	fun `ai help - unauthenticated returns 401`() {
		mockMvc
			.perform(
				post("/api/v1/ai/help")
					.contentType(MediaType.APPLICATION_JSON)
					.content(
						"""{"recipe":{"title":"x","ingredients":[{"quantity":1,"unit":"g","name":"x"}],"instructions":["x"],"portions":1},"prompt":"x"}""",
					),
			).andExpect(status().isUnauthorized)
			.andExpect(jsonPath("$.message").exists())
	}

	@Test
	fun `ai help - missing body returns 400`() {
		val token = register()
		mockMvc
			.perform(
				post("/api/v1/ai/help")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON),
			).andExpect(status().isBadRequest)
			.andExpect(jsonPath("$.message").exists())
	}

	@ParameterizedTest(name = "field: {0}")
	@MethodSource("missingHelpFields")
	fun `ai help - missing required field returns 400`(
		field: String,
		body: String,
	) {
		val token = register()
		mockMvc
			.perform(
				post("/api/v1/ai/help")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content(body),
			).andExpect(status().isBadRequest)
	}

	companion object {
		@JvmStatic
		fun missingHelpFields() =
			listOf(
				Arguments.of(
					"prompt",
					"""{"recipe":{"title":"Pasta","ingredients":[{"quantity":200,"unit":"g","name":"pasta"}],"instructions":["Cook"],"portions":2}}""",
				),
				Arguments.of("recipe", """{"prompt":"How to improve?"}"""),
			)
	}

	// --- POST /ai/recipes ---

	@Test
	fun `ai recipes - returns 200 with generated recipes`() {
		val token = register()
		stubRecipeClient(Mono.just(listOf(sampleRecipeInput)))
		mockMvc
			.perform(
				post("/api/v1/ai/recipes")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"prompt":"Give me a pasta recipe"}"""),
			).andExpect(status().isOk)
			.andExpect(jsonPath("$").isArray)
			.andExpect(jsonPath("$[0].title").value("AI Pasta"))
	}

	@Test
	fun `ai recipes - service returns null returns 502`() {
		val token = register()
		stubRecipeClient(Mono.empty())
		mockMvc
			.perform(
				post("/api/v1/ai/recipes")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"prompt":"Give me a pasta recipe"}"""),
			).andExpect(status().isBadGateway)
			.andExpect(jsonPath("$.message").exists())
	}

	@Test
	fun `ai recipes - unauthenticated returns 401`() {
		mockMvc
			.perform(
				post("/api/v1/ai/recipes")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"prompt":"Give me a recipe"}"""),
			).andExpect(status().isUnauthorized)
			.andExpect(jsonPath("$.message").exists())
	}

	@Test
	fun `ai recipes - missing body returns 400`() {
		val token = register()
		mockMvc
			.perform(
				post("/api/v1/ai/recipes")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON),
			).andExpect(status().isBadRequest)
			.andExpect(jsonPath("$.message").value("Missing or malformed request body"))
	}
}
