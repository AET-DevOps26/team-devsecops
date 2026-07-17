package org.openapitools.configuration

import io.micrometer.observation.ObservationPredicate
import io.micrometer.observation.ObservationRegistry
import io.micrometer.tracing.handler.DefaultTracingObservationHandler
import io.micrometer.tracing.handler.PropagatingReceiverTracingObservationHandler
import io.micrometer.tracing.handler.PropagatingSenderTracingObservationHandler
import io.micrometer.tracing.otel.bridge.OtelBaggageManager
import io.micrometer.tracing.otel.bridge.OtelCurrentTraceContext
import io.micrometer.tracing.otel.bridge.OtelPropagator
import io.micrometer.tracing.otel.bridge.OtelTracer
import io.opentelemetry.api.common.AttributeKey
import io.opentelemetry.api.common.Attributes
import io.opentelemetry.api.trace.propagation.W3CTraceContextPropagator
import io.opentelemetry.context.propagation.ContextPropagators
import io.opentelemetry.exporter.otlp.http.trace.OtlpHttpSpanExporter
import io.opentelemetry.sdk.OpenTelemetrySdk
import io.opentelemetry.sdk.resources.Resource
import io.opentelemetry.sdk.trace.SdkTracerProvider
import io.opentelemetry.sdk.trace.export.BatchSpanProcessor
import io.opentelemetry.sdk.trace.samplers.Sampler
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.micrometer.observation.autoconfigure.ObservationRegistryCustomizer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.server.observation.ServerRequestObservationContext

// Spring Boot 4.x removed tracing autoconfiguration; this class replaces it.
@Configuration(proxyBeanMethods = false)
class TracingConfiguration(
	@Value("\${spring.application.name:spring-api}")
	private val serviceName: String,
	@Value("\${management.otlp.tracing.endpoint:http://alloy.monitoring.svc.cluster.local:4318/v1/traces}")
	private val otlpEndpoint: String,
	@Value("\${management.tracing.sampling.probability:0.1}")
	private val samplingProbability: Double,
) {
	@Bean
	fun otlpHttpSpanExporter(): OtlpHttpSpanExporter = OtlpHttpSpanExporter.builder().setEndpoint(otlpEndpoint).build()

	@Bean
	fun sdkTracerProvider(spanExporter: OtlpHttpSpanExporter): SdkTracerProvider {
		val resource =
			Resource.getDefault().merge(
				Resource.create(Attributes.of(AttributeKey.stringKey("service.name"), serviceName)),
			)
		return SdkTracerProvider
			.builder()
			.setResource(resource)
			.setSampler(Sampler.parentBased(Sampler.traceIdRatioBased(samplingProbability)))
			.addSpanProcessor(BatchSpanProcessor.builder(spanExporter).build())
			.build()
	}

	@Bean
	fun openTelemetrySdk(tracerProvider: SdkTracerProvider): OpenTelemetrySdk =
		OpenTelemetrySdk
			.builder()
			.setTracerProvider(tracerProvider)
			.setPropagators(ContextPropagators.create(W3CTraceContextPropagator.getInstance()))
			.build()

	@Bean
	fun otelCurrentTraceContext(): OtelCurrentTraceContext = OtelCurrentTraceContext()

	@Bean
	fun otelBaggageManager(currentTraceContext: OtelCurrentTraceContext): OtelBaggageManager =
		OtelBaggageManager(currentTraceContext, emptyList(), emptyList())

	@Bean
	fun otelTracer(
		openTelemetry: OpenTelemetrySdk,
		currentTraceContext: OtelCurrentTraceContext,
		baggageManager: OtelBaggageManager,
	): OtelTracer =
		OtelTracer(
			openTelemetry.getTracer("io.micrometer.tracing.otel"),
			currentTraceContext,
			OtelTracer.EventPublisher { },
			baggageManager,
		)

	@Bean
	fun otelPropagator(openTelemetry: OpenTelemetrySdk): OtelPropagator =
		OtelPropagator(openTelemetry.propagators, openTelemetry.getTracer("io.micrometer.tracing.otel"))

	@Bean
	fun noNoisyObservations(): ObservationPredicate =
		ObservationPredicate { name, context ->
			if (name.startsWith("spring.security")) return@ObservationPredicate false
			if (name == "http.server.requests" && context is ServerRequestObservationContext) {
				context.carrier?.requestURI?.startsWith("/actuator/") != true
			} else {
				true
			}
		}

	@Bean
	fun tracingObservationRegistryCustomizer(
		tracer: OtelTracer,
		propagator: OtelPropagator,
		noNoisyObservations: ObservationPredicate,
	): ObservationRegistryCustomizer<ObservationRegistry> =
		ObservationRegistryCustomizer { registry ->
			registry
				.observationConfig()
				.observationPredicate(noNoisyObservations)
				.observationHandler(
					io.micrometer.observation.ObservationHandler.FirstMatchingCompositeObservationHandler(
						PropagatingReceiverTracingObservationHandler(tracer, propagator),
						PropagatingSenderTracingObservationHandler(tracer, propagator),
						DefaultTracingObservationHandler(tracer),
					),
				)
		}
}
