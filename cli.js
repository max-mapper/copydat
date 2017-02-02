#!/usr/bin/env node
var fs = require('fs')
var net = require('net')
var server = require('./')
var client = require('./client')
var crypto = require('crypto')
var speedo = require('speedometer')
var pb = require('pretty-bytes')


if (process.argv[3]) {
  client(process.argv[2], process.argv[3])
} else {
  var newKey = crypto.randomBytes(32).toString('hex')
  console.log(newKey)
  server(newKey, process.argv[2])
}

// client.on('data', function (ch) {
//   speed(ch.length)
// })
// setInterval(function () {
//   console.log(pb(speed()))
// }, 500)
