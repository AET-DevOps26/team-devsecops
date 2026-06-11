package org.openapitools.api

import org.junit.jupiter.api.BeforeEach
import org.openapitools.repository.UserRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@TestPropertySource(
	properties = [
		"ai.hmac.secret=test-secret-for-testing",
		"spring.main.allow-bean-definition-overriding=true",
	],
)
abstract class ApiTestBase {
	@Autowired lateinit var mockMvc: MockMvc

	@Autowired lateinit var userRepository: UserRepository

	@BeforeEach
	fun cleanupDatabase() {
		userRepository.deleteAll()
	}

	/** Registers a user and returns their JWT token. */
	protected fun register(
		username: String = "testuser",
		password: String = "testpass1234",
	): String {
		mockMvc
			.perform(
				post("/api/v1/users/register")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"username":"$username","password":"$password"}"""),
			).andExpect(status().isCreated)
		return login(username, password)
	}

	/** Logs in and returns the JWT token. */
	protected fun login(
		username: String,
		password: String,
	): String {
		val result =
			mockMvc
				.perform(
					post("/api/v1/users/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""{"username":"$username","password":"$password"}"""),
				).andReturn()
		return result.response.contentAsString
			.substringAfter("\"token\":\"")
			.substringBefore("\"")
	}
}
