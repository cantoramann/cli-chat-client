const { getInput } = require('./utils')
const { generateUsername } = require('unique-username-generator')
const { io } = require('socket.io-client')
const readline = require('readline')
const chalk = require('chalk') // using a previous version of chalk for ESM compatibility
const { config } = require('./config')

let sessionDetails = null

const loop = async () => {
  // check if the data file exists
  const username = generateUsername()
  const { bio } = await getInput('bio', 'Enter your bio: ')

  console.log('username: ', username)

  // connect to the server
  const socket = io.connect(config.url, { reconnect: true })
  enableReceivers(socket)

  socket.emit('join queue', { username, bio })
}

const enableReceivers = async (socket) => {
  if (!socket) {
    console.log('There was an issue connecting to the server. Please try again later.')
    process.exit(0)
  }

  socket.on('joined the queue successfully', (data) => {
    console.log('Waiting on queue for a match...')
  })

  socket.on('queue is full', () => {
    console.log('Sorry, the queue is full. Please try again later.')
    process.exit(0)
  })

  socket.on('new chatroom created', ({ roomDetails, otherUser }) => {
    // store the session details
    sessionDetails = { roomDetails, otherUser }

    console.log(`You have been matched with ${otherUser.username}! You can now chat in the room ${roomDetails.roomNameDisplayed}.`)
    console.log(`The bio of ${otherUser.username} is: ${otherUser.bio}`)

    // start the chat
    console.log(`\n`, chalk.yellow('----- Start chatting below -----'))

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '',
    })

    rl.on('line', (cmd) => {
      // set the prompt to the current user input
      const userInput = rl.line

      process.stdout.moveCursor(0, -1) // up one line
      process.stdout.clearLine(1) // from cursor to end
      process.stdout.moveCursor(0, -1) // up one line
      process.stdout.clearLine(1) // from cursor to end
      console.log(chalk.yellow(`You:`), cmd)

      socket.emit('message sent to other user', {
        roomName: sessionDetails.roomDetails.roomName,
        message: cmd,
      })
    })
  })

  socket.on('other user left the chat', () => {
    console.log(chalk.red('\nBad new... The other user has left the chat.'))
    sessionDetails = null
    process.exit(0)
  })

  socket.on('message arrived from other user', (message) => {
    console.log(chalk.green(`${sessionDetails.otherUser.username}:`), message)
  })

  socket.on('server is shutting down temporarily', () => {
    sessionDetails = null
    console.log(chalk.red('\nOops... This is on us. Please try again in a few minutes'))
    process.exit(0)
  })

  process.on('exit', () => {
    // for consistency, send the same event, regardless of the client state.
    sessionDetails = null
    socket.emit('user left')
  })
}

loop()
