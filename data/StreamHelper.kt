// тут должен быть ван package

import okhttp3.MediaType
import okhttp3.RequestBody
import okhttp3.internal.closeQuietly
import okio.BufferedSink
import okio.Source
import okio.source
import java.io.*

/**
 * Created by yuanxin on 1/30/2018.
 */
object StreamHelper {
    fun create(mediaType: MediaType?, inputStream: InputStream): RequestBody {
        return object : RequestBody() {
            override fun contentType(): MediaType? {
                return mediaType
            }

            override fun contentLength(): Long {
                return try {
                    inputStream.available().toLong()
                } catch (e: IOException) {
                    0
                }
            }

            @Throws(IOException::class)
            override fun writeTo(sink: BufferedSink) {
                var source: Source? = null
                try {
                    source = inputStream.source()
                    sink.writeAll(source)
                } finally {
                    source!!.closeQuietly()
                }
            }
        }
    }
}