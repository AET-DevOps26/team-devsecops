package org.openapitools.api

import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class UsersApiTest : ApiTestBase() {
	// --- Register ---

	@Test
	fun `register - valid data returns 201`() {
		mockMvc
			.perform(
				post("/api/v1/users/register")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"username":"newuser","password":"validpass123"}"""),
			).andExpect(status().isCreated)
	}

	@Test
	fun `register - duplicate username returns 409`() {
		register("dupeuser")
		mockMvc
			.perform(
				post("/api/v1/users/register")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"username":"dupeuser","password":"validpass123"}"""),
			).andExpect(status().isConflict)
			.andExpect(jsonPath("$.message").exists())
	}

	@Test
	fun `register - password too short returns 400`() {
		mockMvc
			.perform(
				post("/api/v1/users/register")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"username":"validuser","password":"abc"}"""),
			).andExpect(status().isBadRequest)
			.andExpect(jsonPath("$.message").value("password: size must be between 4 and 128"))
	}

	@Test
	fun `register - invalid username pattern returns 400`() {
		mockMvc
			.perform(
				post("/api/v1/users/register")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"username":"bad user!","password":"validpass123"}"""),
			).andExpect(status().isBadRequest)
			.andExpect(jsonPath("$.message").exists())
	}

	@Test
	fun `register - missing body returns 400`() {
		mockMvc
			.perform(
				post("/api/v1/users/register")
					.contentType(MediaType.APPLICATION_JSON),
			).andExpect(status().isBadRequest)
			.andExpect(jsonPath("$.message").exists())
	}

	// --- Login ---

	@Test
	fun `login - valid credentials returns 200 with token`() {
		register("logintest", "testpassword")
		mockMvc
			.perform(
				post("/api/v1/users/login")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"username":"logintest","password":"testpassword"}"""),
			).andExpect(status().isOk)
			.andExpect(jsonPath("$.token").isString)
			.andExpect(jsonPath("$.token").isNotEmpty)
	}

	@Test
	fun `login - wrong password returns 401`() {
		register("logintest2", "correctpass")
		mockMvc
			.perform(
				post("/api/v1/users/login")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"username":"logintest2","password":"wrongpass"}"""),
			).andExpect(status().isUnauthorized)
			.andExpect(jsonPath("$.message").exists())
	}

	@Test
	fun `login - unknown user returns 401`() {
		mockMvc
			.perform(
				post("/api/v1/users/login")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"username":"nobody","password":"whatever"}"""),
			).andExpect(status().isUnauthorized)
	}

	@Test
	fun `login - missing body returns 400`() {
		mockMvc
			.perform(
				post("/api/v1/users/login")
					.contentType(MediaType.APPLICATION_JSON),
			).andExpect(status().isBadRequest)
			.andExpect(jsonPath("$.message").exists())
	}

	// --- Logout ---

	@Test
	fun `logout - authenticated returns 200`() {
		val token = register()
		mockMvc
			.perform(
				post("/api/v1/users/logout")
					.header("Authorization", "Bearer $token"),
			).andExpect(status().isOk)
	}

	@Test
	fun `logout - token is blocked and subsequent requests return 401`() {
		val token = register()
		mockMvc
			.perform(post("/api/v1/users/logout").header("Authorization", "Bearer $token"))
			.andExpect(status().isOk)
		mockMvc
			.perform(get("/api/v1/users/profile").header("Authorization", "Bearer $token"))
			.andExpect(status().isUnauthorized)
	}

	@Test
	fun `logout - unauthenticated returns 401`() {
		mockMvc
			.perform(post("/api/v1/users/logout"))
			.andExpect(status().isUnauthorized)
			.andExpect(jsonPath("$.message").exists())
	}

	// --- Profile GET ---

	@Test
	fun `profile get - returns username and preferences`() {
		val token = register("profileuser", "testpass1234")
		mockMvc
			.perform(
				get("/api/v1/users/profile")
					.header("Authorization", "Bearer $token"),
			).andExpect(status().isOk)
			.andExpect(jsonPath("$.username").value("profileuser"))
			.andExpect(jsonPath("$.preferences").exists())
	}

	@Test
	fun `profile get - unauthenticated returns 401`() {
		mockMvc
			.perform(get("/api/v1/users/profile"))
			.andExpect(status().isUnauthorized)
			.andExpect(jsonPath("$.message").exists())
	}

	// --- Profile PUT ---

	@Test
	fun `profile put - update username succeeds`() {
		val token = register("oldname", "testpass1234")
		mockMvc
			.perform(
				put("/api/v1/users/profile")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"username":"newname"}"""),
			).andExpect(status().isOk)
	}

	@Test
	fun `profile put - update password succeeds`() {
		val token = register("passuser", "oldpassword")
		mockMvc
			.perform(
				put("/api/v1/users/profile")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"password":"newpassword"}"""),
			).andExpect(status().isOk)
	}

	@Test
	fun `profile put - update preferences succeeds`() {
		val token = register()
		mockMvc
			.perform(
				put("/api/v1/users/profile")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"preferences":{"diet":["vegan"],"allergies":["nuts"],"aboutMe":["I love cooking"]}}"""),
			).andExpect(status().isOk)
	}

	@Test
	fun `profile put - stores and returns the theme preference`() {
		val token = register()
		mockMvc
			.perform(
				put("/api/v1/users/profile")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"preferences":{"theme":"DARK"}}"""),
			).andExpect(status().isOk)

		mockMvc
			.perform(get("/api/v1/users/profile").header("Authorization", "Bearer $token"))
			.andExpect(status().isOk)
			.andExpect(jsonPath("$.preferences.theme").value("DARK"))
	}

	@Test
	fun `profile put - a theme-only update preserves the other preferences`() {
		val token = register()
		mockMvc
			.perform(
				put("/api/v1/users/profile")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"preferences":{"language":"DE","diet":["vegan"],"allergies":["nuts"]}}"""),
			).andExpect(status().isOk)

		mockMvc
			.perform(
				put("/api/v1/users/profile")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"preferences":{"theme":"DARK"}}"""),
			).andExpect(status().isOk)

		mockMvc
			.perform(get("/api/v1/users/profile").header("Authorization", "Bearer $token"))
			.andExpect(status().isOk)
			.andExpect(jsonPath("$.preferences.theme").value("DARK"))
			.andExpect(jsonPath("$.preferences.language").value("DE"))
			.andExpect(jsonPath("$.preferences.diet[0]").value("vegan"))
			.andExpect(jsonPath("$.preferences.allergies[0]").value("nuts"))
	}

	@Test
	fun `profile put - updating other preferences preserves a previously saved theme`() {
		val token = register()
		mockMvc
			.perform(
				put("/api/v1/users/profile")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"preferences":{"theme":"DARK"}}"""),
			).andExpect(status().isOk)

		mockMvc
			.perform(
				put("/api/v1/users/profile")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"preferences":{"diet":["keto"]}}"""),
			).andExpect(status().isOk)

		mockMvc
			.perform(get("/api/v1/users/profile").header("Authorization", "Bearer $token"))
			.andExpect(status().isOk)
			.andExpect(jsonPath("$.preferences.theme").value("DARK"))
			.andExpect(jsonPath("$.preferences.diet[0]").value("keto"))
	}

	@Test
	fun `profile put - username conflict returns 409`() {
		register("taken", "testpass1234")
		val token = register("other", "testpass1234")
		mockMvc
			.perform(
				put("/api/v1/users/profile")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"username":"taken"}"""),
			).andExpect(status().isConflict)
			.andExpect(jsonPath("$.message").exists())
	}

	@Test
	fun `profile put - unauthenticated returns 401`() {
		mockMvc
			.perform(
				put("/api/v1/users/profile")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"username":"test"}"""),
			).andExpect(status().isUnauthorized)
	}

	// --- Profile DELETE ---

	@Test
	fun `profile delete - returns 204 and removes user`() {
		val token = register("todelete", "testpass1234")
		mockMvc
			.perform(
				delete("/api/v1/users/profile")
					.header("Authorization", "Bearer $token"),
			).andExpect(status().isNoContent)

		assert(userRepository.findByUsername("todelete").isEmpty)
	}

	@Test
	fun `profile delete - unauthenticated returns 401`() {
		mockMvc
			.perform(delete("/api/v1/users/profile"))
			.andExpect(status().isUnauthorized)
	}
}
