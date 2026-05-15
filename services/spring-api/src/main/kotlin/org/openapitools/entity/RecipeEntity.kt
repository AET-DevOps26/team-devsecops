package org.openapitools.entity

import jakarta.persistence.*

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

	var portions: Int,
	var nutrientKcal: Int,
	var nutrientCarb: Int,
	var nutrientProt: Int,
	var nutrientFat: Int,

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	val user: UserEntity,
)
