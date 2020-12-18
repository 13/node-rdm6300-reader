#!/usr/bin/env node

// yargs
const argv = require('yargs')(process.argv.slice(2))
  // help text
  .alias('h', 'help')
  .help('help')
  .usage('Usage: $0 -p [tty]')
  // tty port
  .option('p', {
      alias : 'port',
      describe: 'tty port',
      type: 'string',
      nargs: 1,
      demand: true,
      demand: 'tty port is required',
      //default: '/dev/ttyACM0',
      requiresArg:true
  })
  .option('t', {
      alias : 'timestamp',
      describe: 'show timestamp',
      nargs: 0,
      //default: false,
      requiresArg: false
  })
  .option('v', {
      alias : 'verbose',
      describe: 'show verbose',
      count: true,
      nargs: 0,
      //default: false,
      requiresArg: false
  })
  .option('m', {
      alias : 'mqtt',
      describe: 'mqtt server address',
      type: 'string',
      nargs: 1,
      default: 'localhost',
      requiresArg: true
  }).argv

// configuration
const tty = argv.port || '/dev/ttyACM0'
const mqtt_address = argv.mqtt || 'localhost'
const showTimestamp = (argv.timestamp ? true : false)

// verbose
VERBOSE_LEVEL = argv.verbose;
function WARN()  { VERBOSE_LEVEL >= 0 && console.log.apply(console, arguments); }
function INFO()  { VERBOSE_LEVEL >= 1 && console.log.apply(console, arguments); }
function DEBUG() { VERBOSE_LEVEL >= 2 && console.log.apply(console, arguments); }

// dayjs
const dayjs = require('dayjs')

// fs
const fs = require("fs")
fs.access(tty, (err) => {
  if (err) {
    console.log('error', err)
    process.exit(1)
  }
})

// serial
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
var port = new SerialPort(tty, { baudRate: 9600 })
var parser_sp = port.pipe(new Readline({ delimiter: '\n' }))

// mqtt
const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://' + mqtt_address)

// keepalive
var lastMsgDate = new Date()

// start msg
console.log(getTime() + 'node-rdm6300-reader starting ...')
console.log(getTime() + 'tty: '+ tty + ', mqtt: ' + mqtt_address)

// serialport
port.on('open', () => {
  console.log(getTime() + 'serial port opened')
  //setTimeout(keepAlive, 1 * 60 * 1000)
})

port.on('close', () => {
  console.log(getTime() + 'serial port closed')
  //reConnect()
  process.exit(1)
})

port.on('error', (err) => {
  console.log(getTime() + 'serial port error')
  console.log('error', err)
  //reConnect()
})

// check for connection errors or drops and reconnect
var reConnect = function () {
  console.log('reconnecting ...')
  port.close()
  setTimeout(function(){
    console.log('trying ...')
    port = new SerialPort(tty, { baudRate: 9600 })
  }, 5000)
}

parser_sp.on('data', data =>{
  console.log(getTime() + "" + data)
  data = data.toString("utf-8")
  console.log(getTime() + "" + data)
  data = data.replace(/(\r\n|\n|\r)/gm,"").trim()
  console.log(getTime() + "" + data)

})

function keepAlive() {
  var keepAliveDate = new Date()
  var FIVE_MIN= 5 * 60 * 1000
  var TWO_MIN= 2 * 60 * 1000
  var ONE_MIN= 2 * 60 * 1000
  if((keepAliveDate - new Date(lastMsgDate)) > FIVE_MIN) {
    WARN(getTime() + 'timeout!')
    DEBUG((keepAliveDate - new Date(lastMsgDate))/1000 + " seconds")
    DEBUG(((keepAliveDate - new Date(lastMsgDate))/1000)*60 + " minutes")	  
    port.close()
    //reConnect()
  } else {
    DEBUG(getTime() + 'MARK')
  }
  setTimeout(keepAlive, 1 * 60 * 1000)
}

function getTime() {
  if (showTimestamp) {
    return dayjs().format('HH:mm:ss.SSS ')
  } else {
    return ''
  }
}
