package org.openapitools.api

import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.Arguments
import org.junit.jupiter.params.provider.MethodSource
import org.mockito.Mockito
import org.mockito.kotlin.any
import org.mockito.kotlin.whenever
import org.openapitools.internal.client.HelpServiceApi
import org.openapitools.internal.client.RecipeServiceApi
import org.openapitools.model.RecipeIngredient
import org.openapitools.model.RecipeInput
import org.openapitools.model.RecipeNutrients
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Import
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.web.server.ResponseStatusException
import okhttp3.ResponseBody.Companion.toResponseBody
import retrofit2.Call
import retrofit2.Response
import java.math.BigDecimal
import java.io.InterruptedIOException

@Import(AIApiTest.MockApiServices::class)
class AIApiTest : ApiTestBase() {

    @TestConfiguration
    class MockApiServices {
        val helpServiceApi: HelpServiceApi = Mockito.mock(HelpServiceApi::class.java)
        val recipeServiceApi: RecipeServiceApi = Mockito.mock(RecipeServiceApi::class.java)

        @Bean fun helpServiceApi(): HelpServiceApi = helpServiceApi
        @Bean fun recipeServiceApi(): RecipeServiceApi = recipeServiceApi
    }

    @Autowired lateinit var mockApiServices: MockApiServices

    @BeforeEach
    fun resetMocks() {
        Mockito.reset(mockApiServices.helpServiceApi, mockApiServices.recipeServiceApi)
    }

    // Helper to generate a mock Retrofit Call object wrapping a successful response
    private fun <T> createMockCall(body: T?): Call<T> {
        val mockCall = Mockito.mock(Call::class.java) as Call<T>
        val response = Response.success(body)
        whenever(mockCall.execute()).thenReturn(response)
        return mockCall
    }

    // Helper to generate a mock Retrofit Call object wrapping an HTTP error code response
    private fun <T> createMockErrorCall(statusCode: Int): Call<T> {
        val mockCall = Mockito.mock(Call::class.java) as Call<T>
        val response = Response.error<T>(statusCode, "Internal Error".toResponseBody("application/json".toMediaType()))
        whenever(mockCall.execute()).thenReturn(response)
        return mockCall
    }

    // Helper to generate a mock Retrofit Call that throws a low-level network timeout exception
    private fun <T> createMockTimeoutCall(): Call<T> {
        val mockCall = Mockito.mock(Call::class.java) as Call<T>
        whenever(mockCall.execute()).thenThrow(InterruptedIOException("timeout"))
        return mockCall
    }

    private fun stubHelpClient(body: org.openapitools.internal.model.HelpResponse?) {
        val callStub = createMockCall(body)
        whenever(mockApiServices.helpServiceApi.aiHelpPost(any(), any(), any())).thenReturn(callStub)
    }

    private fun stubHelpClientError(statusCode: Int) {
        val callStub = createMockErrorCall<org.openapitools.internal.model.HelpResponse>(statusCode)
        whenever(mockApiServices.helpServiceApi.aiHelpPost(any(), any(), any())).thenReturn(callStub)
    }

    private fun stubHelpClientTimeout() {
        val callStub = createMockTimeoutCall<org.openapitools.internal.model.HelpResponse>()
        whenever(mockApiServices.helpServiceApi.aiHelpPost(any(), any(), any())).thenReturn(callStub)
    }

    private fun stubRecipeClient(body: List<org.openapitools.internal.model.RecipeInput>?) {
        val callStub = createMockCall(body)
        whenever(mockApiServices.recipeServiceApi.aiRecipesPost(any(), any(), any())).thenReturn(callStub)
    }

    private fun stubRecipeClientError(statusCode: Int) {
        val callStub = createMockErrorCall<List<org.openapitools.internal.model.RecipeInput>>(statusCode)
        whenever(mockApiServices.recipeServiceApi.aiRecipesPost(any(), any(), any())).thenReturn(callStub)
    }

    private fun stubRecipeClientTimeout() {
        val callStub = createMockTimeoutCall<List<org.openapitools.internal.model.RecipeInput>>()
        whenever(mockApiServices.recipeServiceApi.aiRecipesPost(any(), any(), any())).thenReturn(callStub)
    }

    private val sampleInternalRecipeInput =
        org.openapitools.internal.model.RecipeInput(
            title = "AI Pasta",
            ingredients = listOf(org.openapitools.internal.model.RecipeIngredient(quantity = 200.0, unit = "g", name = "pasta")),
            instructions = listOf("Boil water", "Cook pasta"),
            portions = 2.0,
            nutrients = org.openapitools.internal.model.RecipeNutrients(calories = 400, protein = 12, fat = 2, carbs = 70),
        )

    // --- POST /ai/help ---

    @Test
    fun `ai help - returns 200 with AI response`() {
        val token = register()
        stubHelpClient(org.openapitools.internal.model.HelpResponse("Try adding more salt."))
        
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
    fun `ai help - service returns error returns 502`() {
        val token = register()
        stubHelpClientError(500) // Simulates a 500 failure from Python
        
        mockMvc
            .perform(
                post("/api/v1/ai/help")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """{"recipe":{"title":"Pasta","ingredients":[{"quantity":200,"unit":"g","name":"pasta"}],"instructions":["Cook"],"portions":2},"prompt":"Help?"}""",
                    ),
            ).andExpect(status().isBadGateway)
    }

    @Test
    fun `ai help - connection timeouts return 504`() {
        val token = register()
        stubHelpClientTimeout() // Simulates the 60 second OkHttp trigger limit aborting
        
        mockMvc
            .perform(
                post("/api/v1/ai/help")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """{"recipe":{"title":"Pasta","ingredients":[{"quantity":200,"unit":"g","name":"pasta"}],"instructions":["Cook"],"portions":2},"prompt":"Help?"}""",
                    ),
            ).andExpect(status().isGatewayTimeout)
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
        stubRecipeClient(listOf(sampleInternalRecipeInput))
        
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
    fun `ai recipes - service returns error returns 502`() {
        val token = register()
        stubRecipeClientError(500)
        
        mockMvc
            .perform(
                post("/api/v1/ai/recipes")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"prompt":"Give me a pasta recipe"}"""),
            ).andExpect(status().isBadGateway)
    }

    @Test
    fun `ai recipes - connection timeouts return 504`() {
        val token = register()
        stubRecipeClientTimeout()
        
        mockMvc
            .perform(
                post("/api/v1/ai/recipes")
                    .header("Authorization", "Bearer $token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"prompt":"Give me a pasta recipe"}"""),
            ).andExpect(status().isGatewayTimeout)
    }

    @Test
    fun `ai recipes - unauthenticated returns 401`() {
        mockMvc
            .perform(
                post("/api/v1/ai/recipes")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"prompt":"Give me a recipe"}"""),
            ).andExpect(status().isUnauthorized)
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
    }
}