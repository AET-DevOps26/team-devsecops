package org.openapitools.security

import okhttp3.Interceptor
import okhttp3.Response
import okio.Buffer
import java.security.MessageDigest
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

class InternalHmacInterceptor(
	private val hmacSecret: String,
) : Interceptor {
	override fun intercept(chain: Interceptor.Chain): Response {
		val original = chain.request()

		val timestamp = (System.currentTimeMillis() / 1000).toString()

		val bodyBytes =
			if (original.body != null) {
				val buffer = Buffer()
				original.body!!.writeTo(buffer)
				buffer.readByteArray()
			} else {
				ByteArray(0)
			}

		val hexSignature =
			try {
				val mac = Mac.getInstance("HmacSHA256")
				val secretKey = SecretKeySpec(hmacSecret.toByteArray(Charsets.UTF_8), "HmacSHA256")
				mac.init(secretKey)

				mac.update(timestamp.toByteArray(Charsets.UTF_8))
				mac.update('.'.code.toByte())
				val rawHmac = mac.doFinal(bodyBytes)

				rawHmac.joinToString("") { "%02x".format(it) }
			} catch (e: Exception) {
				""
			}

		val requestBuilder =
			original
				.newBuilder()
				.header("X-Internal-Timestamp", timestamp)
				.header("X-Internal-Signature", hexSignature)

		return chain.proceed(requestBuilder.build())
	}
}
