const Rx = require('@reactivex/rxjs');
const socketIO = require('socket.io');

const listenForJoysticks = (server) => {
  const joysticksStream = new Rx.ReplaySubject();
  let joysticks = [];
  const io = socketIO.listen(server);

  const modifyJoystickList = (newList) => {
    joysticks = newList;
    joysticks.forEach(j => j.removeAllListeners());
    joysticksStream.next(joysticks);
  };

  const listenDisconnect = (joystick) => {
    joystick.on('disconnect', () => {
      console.log('Joystick disconnected from socket', joystick.id);
      modifyJoystickList(joysticks.filter(j => j !== joystick));
    });
    joystick.on('error', console.error);
  };

  io.on('connection', (joystick) => {
    console.log('Joystick connected to socket', joystick.id);
    modifyJoystickList([...joysticks, joystick]);
    listenDisconnect(joystick);
  });

  return joysticksStream;
};

module.exports = listenForJoysticks;
