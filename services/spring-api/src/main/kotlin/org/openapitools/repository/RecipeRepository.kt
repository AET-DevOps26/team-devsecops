package org.openapitools.repository

import org.openapitools.entity.RecipeEntity
import org.springframework.data.jpa.repository.JpaRepository

interface RecipeRepository : JpaRepository<RecipeEntity, Long> {
	// Spring generates: SELECT * FROM recipes WHERE user_id = ?
	fun findByUserId(userId: Long): List<RecipeEntity>
}
