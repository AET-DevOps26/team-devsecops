package org.openapitools.repository

import org.openapitools.entity.TokenBlocklistEntry
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

interface TokenBlocklistRepository : JpaRepository<TokenBlocklistEntry, String> {
	@Transactional
	fun deleteAllByExpiresAtBefore(instant: Instant): Long
}
