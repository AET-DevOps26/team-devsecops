package org.openapitools.security

import org.openapitools.repository.TokenBlocklistRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.Instant

@Component
class TokenBlocklistScheduler(
	private val tokenBlocklist: TokenBlocklistRepository,
) {
	private val log = LoggerFactory.getLogger(javaClass)

	@Scheduled(fixedDelay = 3_600_000)
	fun purgeExpired() {
		val count = tokenBlocklist.deleteAllByExpiresAtBefore(Instant.now())
		if (count > 0) log.info("Purged {} expired token blocklist entries", count)
	}
}
