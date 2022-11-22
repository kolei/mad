# Проект "Каршеринг" (часть III)

## Отправка **multipart** запроса

>Класс **StreamHelper** лежит в файле [`../data/StreamHelper.kt`](../data/StreamHelper.kt) этого репозитория.

```kt
private fun sendFile(
    fileStream: InputStream?,   // поток, который надо отправить
    fileName: String            // имя файла
) 
{
    if (fileStream != null) 
    {
        // поток преобразуем в RequestBody
        val fileBody: RequestBody = StreamHelper
            .create(
                "image/jpg".toMediaType(),
                fileStream
            )

        // из токена и файла формируем MultipartBody запрос    
        val requestBody = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("token", app.user?.userId.toString())
            .addFormDataPart(
                "file", // название части запроса
                fileName,
                fileBody    // тело файла
            )
            .build()

        val request = Request.Builder()
            .url("http://carsharing.kolei.ru/user/photo")
            .post(requestBody)
            .build()

        Http.call(request) { response, error ->
            try {
                if (error != null) throw error
                if (!response!!.isSuccessful)
                    throw Exception(response.message)
            } catch (e: Exception) {
                // вывести алерт
            }
        }
    }
}
```

