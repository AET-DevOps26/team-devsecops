package org.openapitools.repository

import org.openapitools.entity.TokenBlocklistEntry
import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant

interface TokenBlocklistRepository : JpaRepository<TokenBlocklistEntry, String> {
	fun deleteAllByExpiresAtBefore(instant: Instant): Long
}
