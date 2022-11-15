# Вывод списков. Краткая информация о погоде (RecyclerView)

Для начала добавьте в разметку главного окна контейнер **RecyclerView** (в нём мы будем отображать список краткой информации о погоде с шагом 3 часа) и кнопку для смены города:

>Элемент **RecyclerView** предназначен для оптимизации работы со списками и во многом позволяет повысить производительность по сравнению со стандартным **ListView**.

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <!-- тут ваша существующая вёрстка с детальной информацией о погоде -->

    <androidx.recyclerview.widget.RecyclerView
        android:id="@+id/daylyRecyclerView"
        android:layout_width="match_parent"
        android:layout_height="400dp"
        app:layout_constraintBottom_toTopOf="@+id/button"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent" />

    <Button
        android:id="@+id/changeCityButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Выбрать город"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent" />
</androidx.constraintlayout.widget.ConstraintLayout>
```



## Класс погода

Для хранения массива полученных данных нам нужно описать структуру данных. Для этого в котлине есть **data class** - класс, который содержит только свойства.

Выглядит он примерно так (каждый класс нужно заворачивать в отдельный файл в пакете где он используется, либо создать пакет `Common`; класс **Weather** надо поместить в пакет `MainScreen`)

```kt
data class Weather (
    val dt: Int,
    val mainTemp: Double,
    val mainHumidity: Int,
    val weatherIcon: String,
    val weatherDescription: String,
    val windSpeed: Double,
    val windDeg: Int,
    val dtTxt: String
)
```

Имена свойств я оставил как в JSON объекте, чтобы не путаться (хотя желательно, конечно, давать самоочевидные названия).

## Заполнение массива данных о погоде

С моим бесплатным аккаунтом на **openweathermap** кроме текущих данных можно запросить только список за 5 дней:

```txt
### Запрос погоды за 5 дней
GET https://api.openweathermap.org/data/2.5/forecast?lat={{lat}}&lon={{lon}}&appid={{token}}&lang=ru&units=metric
```

>Структуру ответа посмотрите сами

1. Объявим в классе главного окна массив данных о погоде

    ```kt
    private val weatherList = ArrayList<Weather>()
    ```

2. Получаем и заполняем массив (запрос вставьте в конструктор)

    ```kt
    val url = "https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${token}&lang=ru&units=metric"
    Http.call (url) {response, error ->
        try {
            if (error != null) throw error
            if (!response!!.isSuccessful) throw Exception(response.message)            

            // очищаем список            
            weatherList.clear()

            val json = JSONObject(response.body!!.string())
            val list = json.getJSONArray("list")

            // перебираем json массив
            for(i in 0 until list.length()){
                val item = list.getJSONObject(i)
                val weather = item.getJSONArray("weather").getJSONObject(0)

                // добавляем в список новый элемент
                weatherList.add(
                    Weather(
                        item.getInt("dt"),
                        item.getJSONObject("main").getDouble("temp"),
                        item.getJSONObject("main").getInt("humidity"),
                        weather.getString("icon"),
                        weather.getString("description"),
                        item.getJSONObject("wind").getDouble("speed"),
                        item.getJSONObject("wind").getInt("deg"),
                        item.getString("dt_txt")
                    )
                )
            }

            runOnUiThread {
                // уведомляем визуальный элемент, что данные изменились
                dailyInfoRecyclerView.adapter?.notifyDataSetChanged()
            }
        } catch (e: Exception) {
            // любую ошибку показываем на экране
            runOnUiThread {
                AlertDialog.Builder(this)
                    .setTitle("Ошибка")
                    .setMessage(e.message)
                    .setPositiveButton("OK", null)
                    .create()
                    .show()
            }
        }
    }
    ```

## Вывод списка (RecyclerView)

**RecyclerView** - рекомендованный способ вывода списков. Его особенность в том, что для отображения списка создаётся только столько визуальных элементов, сколько их помещается на экран. При выходе за экран визуальный элемент перемещается в конец или начало списка (в зависимости от направления прокрутки) и заполняется данными из массива исходных данных.

Итак, на форме у нас уже лежит элемент **RecyclerView**

В класс главного окна добавим переменную для связи с элементом **RecyclerView**

```kt
private lateinit var dailyInfoRecyclerView: RecyclerView
```

Затем в конструкторе её инициализируем и назначаем *layoutManager* и *adapter*

Получаем указатель на **RecyclerView**

```kt
dailyInfoRecyclerView = findViewById(R.id.dailyInfoRecyclerView)
```

Назначаем менеджер разметки. LinearLayoutManager означает, что у нас будет список (есть ещё вариант с сеткой). Вторым параметром мы указываем в какую сторону он будет прокручиваться (по вертикали или по горизонтали). Это нужно учитывать, когда будем делать вёрстку элемента списка.

```kt
dailyInfoRecyclerView.layoutManager = LinearLayoutManager(
    this, 
    RecyclerView.HORIZONTAL, 
    false)
```

Создаем адаптер. Класс **WeatherAdapter** мы реализуем ниже, в параметрах передаём список элементов погоды (*weatherList*), которые получим при интернет запросе (пока он пустой).

```kt
val weatherAdapter = WeatherAdapter(
    weatherList, 
    this)
```

При клике на элемент списка показать подробную информацию (сделайте сами). В параметре лямбда-функции передаётся элемент списка, на котором кликнули.

```kt
weatherAdapter.setItemClickListener { weather ->
    Log.d("KEILOG", "Click on Weather item")
}
```

Созданный и настроенный *weatherAdapter* присваиваем свойству *adapter* нашего визуального элемента **RecyclerView**

```kt
dailyInfoRecyclerView.adapter = weatherAdapter
```

На этом с инициализацией закончили, рассмотрим реализацию класса **WeatherAdapter**.

Класс **WeatherAdapter** мы должны написать сами. Я положил его в [шпаргалки](../data/WeatherAdapter.kt).

Прежде чем писать класс, мы должны определиться с визуальным представлением элемента списка. Создадим для него файл разметки `weather_item` в каталоге `res/layout`

Разметка для элемента списка (не полная):

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout
    android:id="@+id/container"
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:orientation="vertical"
    android:layout_width="100dp"
    android:layout_height="match_parent">

    <ImageView
        android:id="@+id/weather_icon"
        android:layout_width="match_parent"
        android:layout_height="100dp"/>

    <TextView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Температура"
        />
    <TextView
        android:id="@+id/weather_temp"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"/>

</LinearLayout>
```

Контейнер для элемента - вертикальный **LinearLayout**, высота по контейнеру (контейнером для элемента списка является **RecyclerView**), ширину задаём константой или по содержимому.

Внутри я разместил три элемента: **ImageView** для иконки погоды, и два текстовых поля для температуры. Остальные элементы вы добавьте сами (скорость и направление ветра, влажность) 

Адаптер, который используется в **RecyclerView**, должен наследоваться от абстрактного класса **RecyclerView.Adapter**. Этот класс определяет три метода:

* *onCreateViewHolder*: возвращает объект **ViewHolder**, который хранит ссылки на визуальные элементы из файла разметки

* *onBindViewHolder*: выполняет привязку данных из очередного элемента списка к визуальным элементам из **ViewHolder**.

* *getItemCount*: возвращает количество объектов в списке

Рассмотрим реализацию:

Создаваемый нами класс **WeatherAdapter**, как уже писалось, наследуется от абстрактного класса **RecyclerView.Adapter**, которому нужно указать возвращаемый класс (у нас это будет класс **WeatherAdapter.ViewHolder**, реализуемый, как видно из названия внутри класса **WeatherAdapter**):

```kt
class WeatherAdapter(
    private val values: ArrayList<Weather>,
    private val activity: Activity
): RecyclerView.Adapter<WeatherAdapter.ViewHolder>()
{
```    

В классе **WeatherAdapter** создадим переменную для хранения лямбда функции, которая будет вызываться при клике на элемент списка и метод, который будет назначать этот обработчик:

```kt
private var itemClickListener: ((Weather) -> Unit)? = null

fun setItemClickListener(itemClickListener: (Weather) -> Unit) {
    this.itemClickListener = itemClickListener
}
```

Как уже писалось выше, реализуем метод *onCreateViewHolder*, в котором задаём файл разметки элемента списка:

Метод возвращает экземпляр класса **ViewHolder** (реализованный ниже в этом классе), передавая ему в параметрах используемый шаблон вёрстки:

```kt
override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
    // грузим layout, который содержит вёрстку элемента списка 
    val itemView = LayoutInflater
        .from(parent.context)
        .inflate(R.layout.weather_item,
            parent,
            false)

    return ViewHolder(itemView)
}
```

```kt
override fun getItemCount(): Int = values.size
```

Метод *onBindViewHolder* заполняет актуальными данными очередной отображаемый элемент списка:

```kt
override fun onBindViewHolder(holder: ViewHolder, position: Int) 
{
    holder.tempTextView.text = "${values[position].mainTemp} C"

    holder.container.setOnClickListener {
        //кликнули на элемент списка
        itemClickListener?.invoke(values[position])
    }

    Http.call("http://openweathermap.org/img/w/${values[position].weatherIcon}.png") {response, error ->
        try {
            if (error != null) throw error
            if (!response!!.isSuccessful) throw Exception(response.message)

            var bitmap = BitmapFactory.decodeStream(response.body!!.byteStream())
            activity.runOnUiThread {
                holder.iconImageView.setImageBitmap(bitmap)
            }
        } catch (e: Exception) {
            // по картинкам ошибки не показываем
        }
    }
}
```

Реализация класса **ViewHolder**, хранящего ссылки на виджеты (его пишем тоже внутри класса **WeatherAdapter**):

```kt
class ViewHolder(itemView: View): RecyclerView.ViewHolder(itemView){
    var iconImageView: ImageView = itemView.findViewById(R.id.weather_icon)
    var tempTextView: TextView = itemView.findViewById(R.id.weather_temp)
    var container: LinearLayout = itemView.findViewById(R.id.container)
}
```

## Задание

* Вывести в элементы списка остальную информацию о погоде (скорость и направление ветра, влажность). Направление ветра выводить не текстом, а поворотом стрелки (символ UTF или картинка - на ваше усмотрение)
* При обновлении списка (после получения информации о погоде) и при клике на элемент списка выводить в верхнюю часть детальную информацию о погоде выбранного элемента
