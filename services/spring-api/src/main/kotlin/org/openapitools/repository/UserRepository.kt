package org.openapitools.repository

import org.openapitools.entity.UserEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface UserRepository : JpaRepository<UserEntity, Long> {
	// Spring generates: SELECT * FROM users WHERE username = ?
	fun findByUsername(username: String): Optional<UserEntity>

	fun existsByUsername(username: String): Boolean
}
