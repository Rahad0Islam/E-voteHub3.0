import { Server } from 'socket.io';

let io;

export function initSocket(server, corsOrigin){
  io = new Server(server, {
    cors: {
      origin: corsOrigin || process.env.CORS_ORIGIN || '*',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    // Optionally join rooms by event id from client
    socket.on('joinEvent', (eventId)=>{
      if(eventId){
        socket.join(String(eventId));
      }
    });
    socket.on('leaveEvent', (eventId)=>{
      if(eventId){
        socket.leave(String(eventId));
      }
    });
  });

  return io;
}

export function getIO(){
  if(!io){
    throw new Error('Socket.io not initialized');
  }
  return io;
}
