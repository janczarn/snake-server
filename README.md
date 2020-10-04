Run:

    npm install
    node index.js

Create new game:

    POST: /createGame
    BODY: {
      "name": "Jan",
      "height": 30,
      "width": 30,
      "tick": 1000
    }
    RESPONSE: {
      "gameId": "FWL_rjfRniblhPC8gSXeS",
      "userId": 1,
      "userKey": "iTwLzfTkmYBD2dt25E7so"
    }

Register user:

    POST: /register
    BODY: {
      "gameId": "FWL_rjfRniblhPC8gSXeS",
      "name": "Scott"
    }
    RESPONSE: {
      "userId": 2,
      "userKey": "M0m9_byV8L_paCaQJmTWU"
    }

Connect WebSocket:

    REQUEST: ws://localhost:3000/connect?gameId=FWL_rjfRniblhPC8gSXeS&userId=1&userKey=M0m9_byV8L_paCaQJmTWU

Received message example:

    {
      "stage": "RUNNING",
      "users": [
        {
          "id": 1,
          "position": {
            "x": 18,
            "y": 11
          }
        },
        {
          "id": 2,
          "position": {
            "x": 5,
            "y": 11
          }
        }
      ]
    }

Send message example:

    {
      "operation": 0
    }

Where:

    0 = UP
    1 = DOWN
    2 = LEFT
    3 = RIGHT

Start game:

    POST: /start
    BODY: {
      "gameId": "FWL_rjfRniblhPC8gSXeS",
      "userId": 1,
      "userKey": "iTwLzfTkmYBD2dt25E7so"
    }
