package org.openapitools.model

import java.util.Objects
import com.fasterxml.jackson.annotation.JsonValue
import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import jakarta.validation.Valid
import io.swagger.v3.oas.annotations.media.Schema

/**
* Supported UI and AI-content language as an ISO 639-1 code
* Values: EN,DE,HU
*/
enum class Language(@get:JsonValue val value: kotlin.String) {

    EN("EN"),
    DE("DE"),
    HU("HU");

    companion object {
        @JvmStatic
        @JsonCreator
        fun forValue(value: kotlin.String): Language {
                return values().firstOrNull{it -> it.value == value}
                    ?: throw IllegalArgumentException("Unexpected value '$value' for enum 'Language'")
        }
    }
}
