package org.openapitools

import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Contact
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.info.License
import io.swagger.v3.oas.models.security.SecurityScheme
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class SpringDocConfiguration {
	@Bean
	fun apiInfo(): OpenAPI =
		OpenAPI()
			.info(
				Info()
					.title("Cooking Assistant API")
					.description("API for recipe management and cooking assistance")
					.version("1.0.0"),
			).components(
				Components()
					.addSecuritySchemes(
						"bearerAuth",
						SecurityScheme()
							.type(SecurityScheme.Type.HTTP)
							.scheme("bearer")
							.bearerFormat("JWT"),
					),
			)
}
