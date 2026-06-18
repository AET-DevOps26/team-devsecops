package org.openapitools.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "recipes")
class RecipeEntity(
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
	@Column(nullable = false)
	var title: String,
	@Column(columnDefinition = "TEXT", nullable = false)
	var ingredients: String, // JSON array string, e.g. ["flour","eggs","milk"]
	@Column(columnDefinition = "TEXT", nullable = false)
	var instructions: String,
	var portions: java.math.BigDecimal,
	var nutrientKcal: Int,
	var nutrientCarb: Int,
	var nutrientProt: Int,
	var nutrientFat: Int,
	@Column(nullable = false, updatable = false)
	val createdAt: Instant = Instant.now(),
	@Column(nullable = false)
	var editedAt: Instant = Instant.now(),
	var openedAt: Instant? = null,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	val user: UserEntity,
)
