const { nanoid } = require('nanoid')
const R = require('ramda')
const random = require('random')

const operations = require('./operations')

const games = {}

const sleep = time => new Promise(resolve => {
  setTimeout(() => {
    resolve()
  }, time)
})

const authenticate = (gameId, userId, userKey) => {
  if (games[gameId]) {
    const game = games[gameId]
    if (game.users[userId]) {
      const user = game.users[userId]
      if (user.key === userKey) {
        return true
      } else {
        throw new Error('User key is incorrect')
      }
    } else {
      throw new Error('User does not exist')
    }
  } else {
    throw new Error('Game does not exist')
  }
}
module.exports.authenticate = authenticate

module.exports.createGame = (name, height, width, tick, pubsub) => {
  const gameId = nanoid()
  const userId = 1
  const userKey = nanoid()
  games[gameId] = {
    id: gameId,
    stage: 'SETUP',
    pubsub,
    dimensions: {
      height,
      width
    },
    tick,
    users: {
      [userId]: {
        id: userId,
        key: userKey,
        name,
        owner: true,
        queue: [],
        lastOperation: null
      }
    }
  }
  return {
    gameId,
    userId,
    userKey
  }
}

module.exports.registerUser = (gameId, name) => {
  const game = games[gameId]
  const userId = Object.keys(game.users).length + 1
  const userKey = nanoid()
  game.users[userId] = {
    id: userId,
    key: userKey,
    name,
    queue: [],
    lastOperation: null
  }
  return {
    userId,
    userKey
  }
}

const calculateInitialPositions = gameId => {
  const game = games[gameId]
  const occupiedCells = {}
  Object.keys(game.users).forEach(userId => {
    const user = game.users[userId]
    let position = getRandomCell(game.dimensions.height, game.dimensions.width)
    while (occupiedCells[position.x] && occupiedCells[position.x][position.y]) {
      position = getRandomCell(game.dimensions.height, game.dimensions.width)
    }
    user.position = position
    if (!occupiedCells[position.x]) {
      occupiedCells[position.x] = {}
    }
    occupiedCells[position.x][position.y] = true
  })
}

const getRandomCell = (height, width) => ({
  x: random.int(0, width - 1),
  y: random.int(0, height - 1)
})

module.exports.startGame = async (gameId, userId, userKey) => {
  if (authenticate(gameId, userId, userKey) && games[gameId].users[userId].owner) {
    calculateInitialPositions(gameId)
    setStage(gameId, 'COUNTDOWN-3')
    await sleep(1000)
    setStage(gameId, 'COUNTDOWN-2')
    await sleep(1000)
    setStage(gameId, 'COUNTDOWN-1')
    await sleep(1000)
    setStage(gameId, 'RUNNING')
    setInterval(() => advance(gameId), games[gameId].tick)
  } else {
    throw new Error('User is not the owner')
  }
}

const setStage = (gameId, stage) => {
  const game = games[gameId]
  game.stage = stage
  game.pubsub.publish(game.id, getGameState(gameId))
}

const advance = gameId => {
  const game = games[gameId]
  Object.keys(game.users).forEach(
    userId => advanceUser(gameId, userId)
  )
  game.pubsub.publish(game.id, getGameState(gameId))
}

const advanceUser = (gameId, userId) => {
  const nextOperation = getNextOperation(gameId, userId)
  operate(gameId, userId, nextOperation)
}

const getNextOperation = (gameId, userId) => {
  const user = games[gameId].users[userId]
  if (user.queue.length > 0) {
    return user.queue.shift()
  } else if (!R.isNil(user.lastOperation)) {
    return user.lastOperation
  } else {
    return random.int(0, 3)
  }
}

const operate = (gameId, userId, operation) => {
  const game = games[gameId]
  const dimensions = game.dimensions
  const user = game.users[userId]
  const position = user.position
  if (operation === operations.DOWN) {
    const y = position.y > 0 ? position.y - 1 : dimensions.height - 1
    position.y = y
    user.lastOperation = operation
  } else if (operation === operations.UP) {
    const y = position.y < dimensions.height - 1 ? position.y + 1 : 0
    position.y = y
    user.lastOperation = operation
  } else if (operation === operations.LEFT) {
    const x = position.x > 0 ? position.x - 1 : dimensions.width - 1
    position.x = x
    user.lastOperation = operation
  } else if (operation === operations.RIGHT) {
    const x = position.x < dimensions.width - 1 ? position.x + 1 : 0
    position.x = x
    user.lastOperation = operation
  }
}

module.exports.addToQueue = (gameId, userId, userKey, operation) => {
  if (authenticate(gameId, userId, userKey)) {
    return games[gameId].users[userId].queue.push(operation)
  }
}

module.exports.getDimensions = (gameId, userId, userKey) => {
  if (authenticate(gameId, userId, userKey)) {
    return games[gameId].dimensions
  }
}

const getGameState = (gameId, userId, userKey) => {
  const game = games[gameId]
  return {
    stage: game.stage,
    users: Object.values(game.users).map(user => ({
      id: user.id,
      position: user.position
    }))
  }
}
