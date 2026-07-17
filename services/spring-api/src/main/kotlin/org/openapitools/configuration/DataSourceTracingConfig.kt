package org.openapitools.configuration

import io.opentelemetry.api.OpenTelemetry
import io.opentelemetry.instrumentation.jdbc.datasource.JdbcTelemetry
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.config.BeanPostProcessor
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Lazy
import javax.sql.DataSource

@Configuration(proxyBeanMethods = false)
class DataSourceTracingConfig {
	@Bean
	fun dataSourceTracingPostProcessor(
		@Lazy @Autowired openTelemetry: OpenTelemetry,
	): BeanPostProcessor =
		object : BeanPostProcessor {
			override fun postProcessAfterInitialization(
				bean: Any,
				beanName: String,
			): Any =
				if (beanName == "dataSource" && bean is DataSource) {
					JdbcTelemetry.create(openTelemetry).wrap(bean)
				} else {
					bean
				}
		}
}
