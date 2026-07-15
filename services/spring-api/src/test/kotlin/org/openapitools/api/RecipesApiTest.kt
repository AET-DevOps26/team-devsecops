package org.openapitools.api

import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class RecipesApiTest : ApiTestBase() {
	private val validRecipe =
		"""
		{
			"title": "Test Pasta",
			"ingredients": [{"quantity": 200, "unit": "g", "name": "pasta"}],
			"instructions": ["Boil water", "Cook pasta"],
			"portions": 2,
			"nutrients": {"calories": 400, "protein": 12, "fat": 2, "carbs": 70}
		}
		""".trimIndent()

	private fun postRecipe(
		token: String,
		recipe: String = validRecipe,
	): Long {
		val result =
			mockMvc
				.perform(
					post("/api/v1/recipes")
						.header("Authorization", "Bearer $token")
						.contentType(MediaType.APPLICATION_JSON)
						.content(recipe),
				).andExpect(status().isCreated)
				.andReturn()
		return result.response.contentAsString
			.substringAfter("\"id\":")
			.substringBefore("}")
			.trim()
			.toLong()
	}

	// --- GET /recipes ---

	@Test
	fun `recipes get - returns empty list initially`() {
		val token = register()
		mockMvc
			.perform(
				get("/api/v1/recipes")
					.header("Authorization", "Bearer $token"),
			).andExpect(status().isOk)
			.andExpect(jsonPath("$").isArray)
			.andExpect(jsonPath("$").isEmpty)
	}

	@Test
	fun `recipes get - returns saved recipes`() {
		val token = register()
		postRecipe(token)
		mockMvc
			.perform(
				get("/api/v1/recipes")
					.header("Authorization", "Bearer $token"),
			).andExpect(status().isOk)
			.andExpect(jsonPath("$").isArray)
			.andExpect(jsonPath("$[0].title").value("Test Pasta"))
	}

	@Test
	fun `recipes get - only returns own recipes`() {
		val token1 = register("user1")
		val token2 = register("user2")
		postRecipe(token1)
		mockMvc
			.perform(
				get("/api/v1/recipes")
					.header("Authorization", "Bearer $token2"),
			).andExpect(status().isOk)
			.andExpect(jsonPath("$").isEmpty)
	}

	@Test
	fun `recipes get - unauthenticated returns 401`() {
		mockMvc
			.perform(get("/api/v1/recipes"))
			.andExpect(status().isUnauthorized)
			.andExpect(jsonPath("$.message").exists())
	}

	// --- POST /recipes ---

	@Test
	fun `recipes post - valid recipe returns 201`() {
		val token = register()
		mockMvc
			.perform(
				post("/api/v1/recipes")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content(validRecipe),
			).andExpect(status().isCreated)
	}

	@Test
	fun `recipes post - missing title returns 400`() {
		val token = register()
		mockMvc
			.perform(
				post("/api/v1/recipes")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"ingredients":[{"quantity":1,"unit":"g","name":"x"}],"instructions":["step"],"portions":2}"""),
			).andExpect(status().isBadRequest)
			.andExpect(jsonPath("$.message").exists())
	}

	@Test
	fun `recipes post - empty ingredients list returns 400`() {
		val token = register()
		mockMvc
			.perform(
				post("/api/v1/recipes")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"title":"Test","ingredients":[],"instructions":["step"],"portions":2}"""),
			).andExpect(status().isBadRequest)
	}

	@Test
	fun `recipes post - missing body returns 400`() {
		val token = register()
		mockMvc
			.perform(
				post("/api/v1/recipes")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON),
			).andExpect(status().isBadRequest)
	}

	@Test
	fun `recipes post - unauthenticated returns 401`() {
		mockMvc
			.perform(
				post("/api/v1/recipes")
					.contentType(MediaType.APPLICATION_JSON)
					.content(validRecipe),
			).andExpect(status().isUnauthorized)
	}

	// --- GET /recipes/{recipeId} ---

	@Test
	fun `recipes get by id - returns recipe`() {
		val token = register()
		val id = postRecipe(token)
		mockMvc
			.perform(
				get("/api/v1/recipes/$id")
					.header("Authorization", "Bearer $token"),
			).andExpect(status().isOk)
			.andExpect(jsonPath("$.id").value(id))
			.andExpect(jsonPath("$.title").value("Test Pasta"))
	}

	@Test
	fun `recipes get by id - not found returns 404`() {
		val token = register()
		mockMvc
			.perform(
				get("/api/v1/recipes/99999")
					.header("Authorization", "Bearer $token"),
			).andExpect(status().isNotFound)
			.andExpect(jsonPath("$.message").exists())
	}

	@Test
	fun `recipes get by id - other user's recipe returns 403`() {
		val token1 = register("owner")
		val token2 = register("other")
		val id = postRecipe(token1)
		mockMvc
			.perform(
				get("/api/v1/recipes/$id")
					.header("Authorization", "Bearer $token2"),
			).andExpect(status().isForbidden)
			.andExpect(jsonPath("$.message").value("Recipe belongs to a different user"))
	}

	@Test
	fun `recipes get by id - non-integer id returns 400`() {
		val token = register()
		mockMvc
			.perform(
				get("/api/v1/recipes/notanumber")
					.header("Authorization", "Bearer $token"),
			).andExpect(status().isBadRequest)
			.andExpect(jsonPath("$.message").exists())
	}

	@Test
	fun `recipes get by id - unauthenticated returns 401`() {
		mockMvc
			.perform(get("/api/v1/recipes/1"))
			.andExpect(status().isUnauthorized)
	}

	// --- PUT /recipes/{recipeId} ---

	@Test
	fun `recipes put - updates title returns 200`() {
		val token = register()
		val id = postRecipe(token)
		mockMvc
			.perform(
				put("/api/v1/recipes/$id")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"title":"Updated Pasta"}"""),
			).andExpect(status().isOk)
			.andExpect(jsonPath("$.id").value(id))
			.andExpect(jsonPath("$.title").value("Updated Pasta"))
	}

	@Test
	fun `recipes put - partial update preserves other fields`() {
		val token = register()
		val id = postRecipe(token)
		mockMvc
			.perform(
				put("/api/v1/recipes/$id")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"title":"New Title"}"""),
			).andExpect(status().isOk)
			.andExpect(jsonPath("$.title").value("New Title"))
			.andExpect(jsonPath("$.ingredients[0].name").value("pasta"))
			.andExpect(jsonPath("$.nutrients.calories").value(400))
	}

	@Test
	fun `recipes put - full payload replaces every field`() {
		val token = register()
		val id = postRecipe(token)
		mockMvc
			.perform(
				put("/api/v1/recipes/$id")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content(
						"""
						{
							"title": "Deluxe Pasta",
							"ingredients": [
								{"quantity": 250, "unit": "g", "name": "spaghetti"},
								{"quantity": 3, "unit": "cloves", "name": "garlic"}
							],
							"instructions": ["Boil", "Fry garlic", "Combine"],
							"portions": 1.5,
							"nutrients": {"calories": 620, "protein": 18, "fat": 9, "carbs": 95}
						}
						""".trimIndent(),
					),
			).andExpect(status().isOk)
			.andExpect(jsonPath("$.id").value(id))
			.andExpect(jsonPath("$.title").value("Deluxe Pasta"))
			.andExpect(jsonPath("$.portions").value(1.5))
			.andExpect(jsonPath("$.ingredients.length()").value(2))
			.andExpect(jsonPath("$.ingredients[1].name").value("garlic"))
			.andExpect(jsonPath("$.instructions.length()").value(3))
			.andExpect(jsonPath("$.instructions[2]").value("Combine"))
			.andExpect(jsonPath("$.nutrients.carbs").value(95))
	}

	@Test
	fun `recipes put - not found returns 404`() {
		val token = register()
		mockMvc
			.perform(
				put("/api/v1/recipes/99999")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"title":"x"}"""),
			).andExpect(status().isNotFound)
			.andExpect(jsonPath("$.message").exists())
	}

	@Test
	fun `recipes put - other user's recipe returns 403`() {
		val token1 = register("owner")
		val token2 = register("other")
		val id = postRecipe(token1)
		mockMvc
			.perform(
				put("/api/v1/recipes/$id")
					.header("Authorization", "Bearer $token2")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"title":"stolen"}"""),
			).andExpect(status().isForbidden)
			.andExpect(jsonPath("$.message").exists())
	}

	@Test
	fun `recipes put - unauthenticated returns 401`() {
		mockMvc
			.perform(
				put("/api/v1/recipes/1")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""{"title":"x"}"""),
			).andExpect(status().isUnauthorized)
	}

	@Test
	fun `recipes put - missing body returns 400`() {
		val token = register()
		mockMvc
			.perform(
				put("/api/v1/recipes/1")
					.header("Authorization", "Bearer $token")
					.contentType(MediaType.APPLICATION_JSON),
			).andExpect(status().isBadRequest)
			.andExpect(jsonPath("$.message").exists())
	}

	// --- DELETE /recipes/{recipeId} ---

	@Test
	fun `recipes delete - deletes own recipe returns 204`() {
		val token = register()
		val id = postRecipe(token)
		mockMvc
			.perform(
				delete("/api/v1/recipes/$id")
					.header("Authorization", "Bearer $token"),
			).andExpect(status().isNoContent)

		// Verify it's gone
		mockMvc
			.perform(
				get("/api/v1/recipes/$id")
					.header("Authorization", "Bearer $token"),
			).andExpect(status().isNotFound)
	}

	@Test
	fun `recipes delete - not found returns 404`() {
		val token = register()
		mockMvc
			.perform(
				delete("/api/v1/recipes/99999")
					.header("Authorization", "Bearer $token"),
			).andExpect(status().isNotFound)
			.andExpect(jsonPath("$.message").exists())
	}

	@Test
	fun `recipes delete - other user's recipe returns 403`() {
		val token1 = register("owner")
		val token2 = register("other")
		val id = postRecipe(token1)
		mockMvc
			.perform(
				delete("/api/v1/recipes/$id")
					.header("Authorization", "Bearer $token2"),
			).andExpect(status().isForbidden)
			.andExpect(jsonPath("$.message").exists())
	}

	@Test
	fun `recipes delete - unauthenticated returns 401`() {
		mockMvc
			.perform(delete("/api/v1/recipes/1"))
			.andExpect(status().isUnauthorized)
	}

	@Test
	fun `profile delete - cascades to recipes`() {
		val token = register()
		val id = postRecipe(token)
		// Delete the user
		mockMvc
			.perform(
				delete("/api/v1/users/profile")
					.header("Authorization", "Bearer $token"),
			).andExpect(status().isNoContent)
		// Recipe must be gone from DB (cascade)
		assert(userRepository.count() == 0L)
		// Re-register to have a token to query with
		val token2 = register("newuser")
		mockMvc
			.perform(
				get("/api/v1/recipes/$id")
					.header("Authorization", "Bearer $token2"),
			).andExpect(status().isNotFound)
	}
}
