# Вывод списков. Краткая информация о погоде (RecyclerView)

Для начала добавьте в разметку главного окна контейнер **RecyclerView** (в нём мы будем отображать список краткой информации о погоде с шагом 3 часа) и кнопку для смены города:

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

Для хранения массива полученных данных нам нужно описать структуру элемента списка. Для этого в котлине есть **data class** - класс, который содержит только свойства.

Выглядит он примерно так (каждый класс нужно заворачивать в отдельный файл в пакете где он используется, либо создать пакет Common; класс Weather надо поместить в пакет MainScreen)

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