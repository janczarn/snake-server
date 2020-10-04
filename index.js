const express = require('express')
const http = require('http')
const PubSub = require('pubsub-js')
const WebSocket = require('ws')

const games = require('./games')

const app = express()
app.use(express.json())

app.post('/create', (req, res) => {
  const props = games.createGame(
    req.body.name,
    req.body.height,
    req.body.width,
    req.body.tick,
    PubSub
  )
  res.send(props)
})

app.post('/register', (req, res) => {
  const props = games.registerUser(
    req.body.gameId,
    req.body.name
  )
  res.send(props)
})

app.post('/start', (req, res) => {
  games.startGame(
    req.body.gameId,
    req.body.userId,
    req.body.userKey
  )
  res.send()
})

const server = http.createServer(app)
const wss = new WebSocket.Server({ server, path: '/connect' })
wss.on('connection', (ws, req) => {
  const url = new URL(`http://dummy${req.url}`)
  const q = url.searchParams
  const gameId = q.get('gameId')
  const userId = q.get('userId')
  const userKey = q.get('userKey')
  games.authenticate(gameId, userId, userKey)
  PubSub.subscribe(url.searchParams.get('gameId'), (msg, state) => {
    ws.send(JSON.stringify(state, null, '  '))
  })

  ws.on('message', msg => {
    const o = JSON.parse(msg)
    games.addToQueue(gameId, userId, userKey, o.operation)
  })
})

server.listen(3000)
console.log('Server running on port 3000.')
