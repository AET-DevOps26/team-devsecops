package org.openapitools.pact

import au.com.dius.pact.provider.junit5.HttpTestTarget
import au.com.dius.pact.provider.junit5.PactVerificationContext
import au.com.dius.pact.provider.junit5.PactVerificationInvocationContextProvider
import au.com.dius.pact.provider.junitsupport.Provider
import au.com.dius.pact.provider.junitsupport.State
import au.com.dius.pact.provider.junitsupport.loader.PactFolder
import org.apache.hc.core5.http.HttpRequest
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.TestTemplate
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mockito
import org.mockito.kotlin.any
import org.mockito.kotlin.whenever
import org.openapitools.entity.RecipeEntity
import org.openapitools.entity.UserEntity
import org.openapitools.internal.client.HelpServiceApi
import org.openapitools.internal.client.RecipeServiceApi
import org.openapitools.internal.model.RecipeIngredient
import org.openapitools.internal.model.RecipeInput
import org.openapitools.internal.model.RecipeNutrients
import org.openapitools.repository.RecipeRepository
import org.openapitools.repository.TokenBlocklistRepository
import org.openapitools.repository.UserRepository
import org.openapitools.security.JwtUtils
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.test.context.TestPropertySource
import retrofit2.Call
import retrofit2.Response
import java.math.BigDecimal
import org.openapitools.internal.model.HelpResponse as InternalHelpResponse

/**
 * Provider-side verification of the web-client → spring-api pact.
 *
 * Replays the consumer contract (web-client/pacts/) against the real Spring app over HTTP.
 * The downstream Python GenAI clients are mocked.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(
	properties = [
		"ai.hmac.secret=test-secret-for-testing",
		"spring.main.allow-bean-definition-overriding=true",
	],
)
@Import(SpringApiProviderPactTest.MockAiClients::class)
@Provider("spring-api")
@PactFolder("../../web-client/pacts")
class SpringApiProviderPactTest {
	@TestConfiguration
	class MockAiClients {
		@Bean
		fun recipeServiceApi(): RecipeServiceApi = Mockito.mock(RecipeServiceApi::class.java)

		@Bean
		fun helpServiceApi(): HelpServiceApi = Mockito.mock(HelpServiceApi::class.java)
	}

	@Value("\${local.server.port}")
	private var port: Int = 0

	@Autowired
	private lateinit var userRepository: UserRepository

	@Autowired
	private lateinit var recipeRepository: RecipeRepository

	@Autowired
	private lateinit var tokenBlocklist: TokenBlocklistRepository

	@Autowired
	private lateinit var passwordEncoder: PasswordEncoder

	@Autowired
	private lateinit var jwtUtils: JwtUtils

	@Autowired
	private lateinit var jdbcTemplate: JdbcTemplate

	@Autowired
	private lateinit var recipeServiceApi: RecipeServiceApi

	@Autowired
	private lateinit var helpServiceApi: HelpServiceApi

	/** Bearer token for the current interaction, set when a state creates a user. */
	private var bearerToken: String? = null

	@BeforeEach
	fun before(context: PactVerificationContext) {
		recipeRepository.deleteAll()
		tokenBlocklist.deleteAll()
		userRepository.deleteAll()
		bearerToken = null
		stubAiClients()
		context.target = HttpTestTarget("localhost", port)
	}

	@State("no user testuser exists")
	fun noUser() {
		// Database is already emptied in before(); nothing to set up.
	}

	@State("a user testuser exists")
	fun aUserExists() {
		createUserAndToken()
	}

	@State("no authenticated user")
	fun noAuthenticatedUser() {
		// No user created and no token injected → the request stays unauthenticated → 401.
	}

	@State("username taken is registered to another user")
	fun usernameTaken() {
		createUserAndToken()
		userRepository.save(
			UserEntity(username = "taken", password = passwordEncoder.encode("another-password")!!),
		)
	}

	@State("a user testuser has a recipe")
	fun aUserHasARecipe() {
		val user = createUserAndToken()
		// The pact requests /recipes/1, so pin the identity: the table was just
		// emptied in before(), so the next insert takes id = 1.
		jdbcTemplate.execute("ALTER TABLE recipes ALTER COLUMN id RESTART WITH 1")
		recipeRepository.save(
			RecipeEntity(
				title = "Pancakes",
				ingredients = """[{"quantity":1,"unit":"cup","name":"Flour"}]""",
				instructions = """["Mix the batter.","Cook on a griddle."]""",
				portions = BigDecimal("2"),
				nutrientKcal = 200,
				nutrientCarb = 35,
				nutrientProt = 5,
				nutrientFat = 3,
				user = user,
			),
		)
	}

	@TestTemplate
	@ExtendWith(PactVerificationInvocationContextProvider::class)
	fun verifyPact(
		context: PactVerificationContext,
		request: HttpRequest,
	) {
		if (request.containsHeader("Authorization")) {
			bearerToken?.let { request.setHeader("Authorization", "Bearer $it") }
		}
		context.verifyInteraction()
	}

	private fun createUserAndToken(): UserEntity {
		val user =
			userRepository.save(
				UserEntity(username = "testuser", password = passwordEncoder.encode("testpass1234")!!),
			)
		bearerToken = jwtUtils.generateToken(user.id)
		return user
	}

	private fun stubAiClients() {
		Mockito.reset(recipeServiceApi, helpServiceApi)

		val recipesCall =
			mockCall(
				listOf(
					RecipeInput(
						title = "Pancakes",
						ingredients = listOf(RecipeIngredient(quantity = 1.0, unit = "cup", name = "Flour")),
						instructions = listOf("Mix the batter.", "Cook on a griddle."),
						portions = 2.0,
						nutrients = RecipeNutrients(calories = 200, protein = 5, fat = 3, carbs = 35),
					),
				),
			)
		whenever(recipeServiceApi.aiRecipesPost(any(), any(), any())).thenReturn(recipesCall)

		val helpCall = mockCall(InternalHelpResponse(response = "Grease the pan well."))
		whenever(helpServiceApi.aiHelpPost(any(), any(), any())).thenReturn(helpCall)
	}

	private fun <T> mockCall(body: T): Call<T> {
		@Suppress("UNCHECKED_CAST")
		val call = Mockito.mock(Call::class.java) as Call<T>
		whenever(call.execute()).thenReturn(Response.success(body))
		return call
	}
}
