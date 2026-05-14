package org.openapitools.entity

import jakarta.persistence.*

@Entity
@Table(name = "users")
class UserEntity(
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
	@Column(unique = true, nullable = false)
	var username: String,
	@Column(nullable = false)
	var password: String, // always stored as a BCrypt hash
	@Column(columnDefinition = "TEXT")
	var preferences: String? = null, // stored as a JSON string
	@OneToMany(mappedBy = "user", cascade = [CascadeType.ALL], orphanRemoval = true)
	val recipes: MutableList<RecipeEntity> = mutableListOf(),
)
