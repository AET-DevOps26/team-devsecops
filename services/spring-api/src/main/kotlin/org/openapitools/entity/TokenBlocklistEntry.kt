package org.openapitools.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "token_blocklist")
class TokenBlocklistEntry(
	@Id
	val tokenHash: String,
	@Column(nullable = false)
	val expiresAt: Instant,
)
