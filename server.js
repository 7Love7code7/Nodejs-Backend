"use strict";
require("dotenv").config();
const cluster = require("cluster");
const cache = require("cluster-node-cache")(cluster);
const numCPUs = require("os").cpus().length || 1;
const invoiceMailController = require("./controllers/invoiceMail.controller");
const port = process.env.PORT || 3000; // set the port for our app
let io = require('socket.io');
// START THE SERVER CLUSTER
// =============================================================================

if (numCPUs > 1 && cluster.isMaster) {
  // requiring bill auto aggregation service on master

  console.log(
    "i am master using schedulingPolicy ==>",
    cluster.schedulingPolicy
  );
  //using default round robin scheduling
  // Fork workers in.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork({
      workerId: i + 1
    });
  }
  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    //notify admin if any cluster down
  });
} else {
  // divide server clusters on multiple CPUs if possible
  console.log("I am slave / single CPU");
  const app = require("./helper/config")(cache); //load app synchronously one time on each cluster
  let sock = app.listen(port, {
    origins: '*:*'
  });
  io = io.listen(sock);
  app.set('server', sock);
  app.set('socketio', io);
  io.on('connection', (socket) => {
    // socket.on('invite', (data) => {
    //   console.log("invite", data);
    //   //socket.join(data._id);
    //   io.emit('invite_reply', data)
    // })
    // socket.on('file', (data) => {
    //   io.emit('file_reply', data)
    // })
    socket.on('text', (data) => {
      console.log("text", data)
      data.users.forEach(v => {
        io.to(v).emit('text_reply', data)
      })
    })

    socket.on('join', (data) => {
      console.log("text", data)
      socket.join(data.userId)
    });

    // socket.on('video', (data) => {
    //   io.emit('video_reply', data)
    // })
    // socket.on('audio', (data) => {
    //   io.emit('audio_reply', data)
    // })
    socket.on('disconnect', () => {

    })
  })
  console.log("Magic happens on port " + port);

  if (process.env.workerId == 1) {
    invoiceMailController.register();
  }
}