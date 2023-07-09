const express=require("express");
const {chats} = require("./data/data");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const {colors} =require("colors")
const userRoutes=require('./routes/userRoutes')
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { Socket } = require("socket.io");
dotenv.config();

const app=express();
app.use(express.json()); // to accept JSON data

connectDB()
app.get('/',(req,res)=>{
    res.send("API is running");
});


// app.get('/api/chat',(req,res)=>{
//     res.send(chats);
// })

// app.get('/api/chat/:id',(req,res)=>{
//     console.log(req.params.id);
//     const singlechat = chats.find((c)=> c._id===req.params.id);
//     res.send(singlechat)
// })


app.use('/api/user',userRoutes)
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.use(notFound);
app.use(errorHandler)


const server = app.listen(3030,console.log("Server has started"));

const io=require("socket.io")(server,{
    pingTimeout:60000,
    cors:{
        origin:"http://localhost:3000"
    }
})

io.on("connection",(socket)=>{
    console.log("connected to socket.io");
    socket.on("setup", (userData) => {
      socket.join(userData._id);
      socket.emit("connected");
    });

    socket.on("join chat", (room) => {
      socket.join(room);
      console.log("User Joined Room: " + room);
    });

    socket.on("new message", (newMessageRecieved) => {
      var chat = newMessageRecieved.chat;

      if (!chat.users) return console.log("chat.users not defined");

      chat.users.forEach((user) => {
        if (user._id == newMessageRecieved.sender._id) return;

        socket.in(user._id).emit("message recieved", newMessageRecieved);
      });
    });

    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

    socket.off("setup", () => {
      console.log("USER DISCONNECTED");
      socket.leave(userData._id);
    });

})