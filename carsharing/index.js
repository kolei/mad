'use strict'

const express = require('express')
const fileUpload = require('express-fileupload')
const request = require('request-promise')
var cors = require('cors')
const fs = require('fs')
const { GOOGLE_API_KEY } = require('./google_key')

//добавляю к консольному выводу дату и время
function console_log(fmt, ...aparams){
  fmt = (new Date()).toJSON().substr(0, 19)+' '+fmt
  console.log(fmt, ...aparams)
}

// создание экземпляра http-сервера
const app = express()

// метод .use задает команды, которые будут выполнены до разбора GET/POST команд

// декодирует параметры запроса
app.use( express.urlencoded() )
app.use( express.json() )
app.use(fileUpload())

app.use('/images', cors(), express.static(__dirname +'/images') )
app.use('/swagger', cors(), express.static(__dirname +'/swagger') )
// для оферты
app.use('/public', cors(), express.static(__dirname +'/public') )

// логгирую все входящие запросы
app.use((req, res, next)=>{
  console_log('[express] %s %s request from %s, body: %s', req.method, req.path, req.ip, JSON.stringify(req.body))
  next()
})

const registeredUsers = []

function findUserByPhone(phone) {
  for (let i = 0; i < registeredUsers.length; i++) {
    if (registeredUsers[i].phone == phone) 
      return registeredUsers[i]
  }
  return null
}

function findUserByToken(token) {
  for (let i = 0; i < registeredUsers.length; i++) {
    if (registeredUsers[i].token == token) 
      return registeredUsers[i]
  }
  return null
}

app.options('/auth/register', cors())
app.post('/auth/register', cors(), (req,res)=>{
  try {
    if(req.body.phone==undefined) 
      throw new Error('Not found "phone" param')

    if(req.body.password==undefined) 
      throw new Error('Not found "password" param')

    if(req.body.firstName==undefined) 
      throw new Error('Not found "firstName" param')

    if(req.body.lastName==undefined) 
      throw new Error('Not found "lastName" param')

    // const re = new RegExp(`^7\d{10}$`)
    // if (!re.test(req.body.phone))
    //   throw new Error('Param "phone" don`t match template')

    let user = findUserByPhone(req.body.phone)
    if (user == null) {
      let user = null
      let token = null
      do {
        token = Math.ceil(Math.random() * 999998)
        user = findUserByToken(token)
      } while (user != null)

      registeredUsers.push({
        phone: req.body.phone,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        token: token
      })
    }

    res.status(201)
  } catch (error) {
    res.statusMessage = error.message
    res.status(401)
  }
  res.end()
})

app.options('/auth/login', cors())
app.post('/auth/login', cors(), (req,res)=>{
  try {
    if(req.body.phone==undefined) 
      throw new Error('Not found "phone" param')

    if(req.body.password==undefined) 
      throw new Error('Not found "password" param')

    let user = findUserByPhone(req.body.phone)
    if (user == null) res.status(404)
    else {
      if (user.password != req.body.password)
        throw new Error('Wrong password')
      res.json(userModel(user))
    }
  } catch (error) {
    res.statusMessage = error.message
    res.status(400)
  }
  res.end()
})

function checkAuth(req){
  if(req.headers.authorization==undefined) 
    throw new Error('No Authorization header')

  let parts = req.headers.authorization.split(' ')
  if (parts.length == 2) {
    if (parts[0] == 'Bearer') {
      let user = findUserByToken(parts[1])
      if (user == null)
        throw new Error('User not found')
      return user
    } else
      throw new Error('Unsupported Authorization method')
  } else
    throw new Error('Bad Authorization content')
}

// app.options('/movies', cors())
// app.get('/movies', cors(), (req,res)=>{
//   try {
//     if (typeof req.query.filter == 'undefined')
//       throw new Error('Filter is required parameter')

//     // checkAuth(req)

//     let filtered = movies
//       .filter(m => m.filters.includes(req.query.filter))
//     let mapped = filtered.map(m => {
//       return {
//         movieId: m.movieId, 
//         name: m.name,
//         description: m.description,
//         age: m.age, 
//         images: m.images, 
//         poster: m.poster, 
//         tags: m.tags
//       }
//     })
//     res.json(mapped)
//   } catch (error) {
//     res.statusMessage = error.message
//     res.status(400)
//   }
//   res.end()
// })

function userModel (user) {
  const userObj = {
    userId: user.token,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone
  }

  let valid = 0

  let avatarName = `${user.phone}_avatar.jpg`
  if (fs.existsSync(__dirname + `/images/${avatarName}`)) userObj.avatar = avatarName
  let pravaName = `${user.phone}_prava.jpg`
  if (fs.existsSync(__dirname + `/images/${pravaName}`)) {
    userObj.prava = pravaName
    valid++
  }
  let passportName = `${user.phone}_passport.jpg`
  if (fs.existsSync(__dirname + `/images/${passportName}`)) {
    userObj.passport = passportName
    valid++
  }

  // TODO добавить проверку штрафов
  userObj.valid = valid == 2

  return userObj
}

app.options('/user', cors())
app.get('/user', cors(), (req,res)=>{
  try {
    let user = checkAuth(req)
    res.json(userModel(user))
  } catch (error) {
    res.statusMessage = error.message
    res.status(401)
  }
  res.end()
})

app.options('/user/photo', cors())
app.post('/user/photo', cors(), (req, res) => {
  try {
    // console.log(req.files)

    if(req.body.token==undefined) 
      throw new Error('Not found "token" param in body')

    const user = findUserByToken(req.body.token)
    if(!user) throw new Error('User not found')

    const { file } = req.files
    if (!file) throw new Error('No file in request')

    const fileName = user.phone+'_'+file.name
    file.mv(__dirname + '/images/' + fileName)
    res.json(userModel(user))
  } catch (error) {
    res.statusMessage = error.message
    res.status(400)
  }
  res.end()
})

const cars = [
  {lat:56.639053,lon:47.893739,model:'Лада Гранта',
   number:'A100AA12',tarif:8.99,km_left:600,kreslo:true,
   kpp:'manual',photo:'granta.webp'},
  {lat:56.638792,lon:47.889641,model:'Nissan Note',
   number:'B200BB12',tarif:9.99,km_left:400,kreslo:false,
   kpp:'variator',photo:'note.jpg'},
  {lat:56.640389,lon:47.896267,model:'Shkoda Rapid',
   number:'C300CC12',tarif:11,  km_left:400,kreslo:false,
   kpp:'automat',photo:'rapid.png'}
]

app.options('/cars', cors())
app.get('/cars', cors(), (req, res) => {
  try {
    checkAuth(req)
    // TODO выбирать по расстоянию
    res.json(cars)
  } catch (error) {
    res.statusMessage = error.message
    res.status(400)
  }
  res.end()
})

app.options('/directions', cors())
app.get('/directions', cors(), (req, res) => {
  try {
    checkAuth(req)

    let url = ''

    // все входящие параметры, кроме токена, передаем дальше
    Object.keys(req.query).forEach((key) => {
      if(url=="") url = "https://maps.googleapis.com/maps/api/directions/json?"
      else url += '&'
      url+=key+'='+req.query[key]
    })

    url += `&key=${GOOGLE_API_KEY}`

    console_log('Directions redirect: %s', url)

    // http-запрос
    request({
        method: 'GET',
        uri: url,
        json: true
    }).then((response) => {
        // Запрос был успешным, используйте объект ответа как хотите
        console_log('get directions google result: ', JSON.stringify(response) )
        res.json( response )
        res.end()
    }).catch((err) => {
        // Произошло что-то плохое, обработка ошибки
        console_log('get directions google error: %s', err.message )
        res.statusMessage = err.message
        res.status(400)
        res.end()
    })
  } catch (error) {
    console_log('get directions request error: %s', error.message)
    res.statusMessage = err.message
    res.status(400)
    res.end()
  }
})

app.listen(3020, '0.0.0.0', ()=>{
    console_log('HTTP сервер успешно запущен на порту 3020')
}).on('error', (err)=>{
    console_log('ошибка запуска HTTP сервера: %s', err)
})