#!/usr/bin/env node
var fs = require('fs')
var net = require('net')
var server = require('./')
var client = require('./client')
var crypto = require('crypto')
var speedo = require('speedometer')
var pb = require('pretty-bytes')

var key = process.argv[2]
var file = process.argv[3]

if (file) {
  server(key, file)
} else {
  client(key, './')
}

// client.on('data', function (ch) {
//   speed(ch.length)
// })
// setInterval(function () {
//   console.log(pb(speed()))
// }, 500)
