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
const {tags, readerLocation, mqttAddress} = require('./env')
const tty = argv.port || '/dev/ttyACM0'
//const mqttAddress = argv.mqtt || mqttAddress
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
const Delimiter = require('@serialport/parser-delimiter')
const port = new SerialPort(tty, { baudRate: 9600, highWaterMark: 1 })
const parser_sp = port.pipe(new Delimiter({ delimiter: '\x03' }))

// mqtt
const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://' + mqttAddress)

// keepalive
var lastMsgDate = new Date()

// start msg
console.log(getTime() + 'node-rdm6300-reader starting ...')
console.log(getTime() + 'tty: '+ tty + ', mqtt: ' + mqttAddress)

// serialport
port.on('open', () => {
  console.log(getTime() + 'serial port opened')
  //setTimeout(keepAlive, 1 * 60 * 1000)
})

port.on('close', () => {
  console.log(getTime() + 'serial port closed')
})

port.on('pause', () => {
  INFO(getTime() + 'serial port paused 10s')
  setTimeout(function(){
    INFO(getTime() + 'serial port resumed')
    port.flush()
    port.resume()
  }, 10000)
})

port.on('error', (err) => {
  console.log(getTime() + 'serial port error')
  console.log('error', err)
  //reConnect()
})

parser_sp.on('data', data =>{
  DEBUG(getTime() + 'data: ' + JSON.stringify(data))
  let buf = data
  data = data.toString("utf-8")
  DEBUG(getTime() + 'data utf8: ' + JSON.stringify(data))
  data = data.replace(/(\r\n|\n|\r|\x02|\x03)/gm,"").trim()
  if (buf.indexOf('\x02') == 0 && data.length == 12){
    DEBUG(getTime() + 'data: ok')

    if (tags[data.toString()]){
      console.log(getTime() + 'Welcome ' + tags[data.toString()])
      let data_json = new Object()
      data_json.tag = tags[data.toString()] 
      data_json.location = readerLocation 
      //data_json.dt = 
      //client.publish('rfid/' + data_json.location + '/json', JSON.stringify(data_json))
      client.publish('rfid/json', JSON.stringify(data_json))
    } else {
      console.log(getTime() + 'Denied ' + data.toString())
    }

  } else {
      console.log(getTime() + 'Wrong data string ' + data.toString())
  }
  port.pause()
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
