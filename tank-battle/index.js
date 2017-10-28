const getTanks = require('./tank');
const server = require('./express-server');
const joysticsStream = require('./joysticks')(server);

const game = {};

const MAX_USERS = 2;
const MAX_SPEED = 255;

const emitLives = (user) => {
  user.joystick.emit('lives', {
    lives: user.tank.lives
  });
};

const emitGameOver = (user, loserId) => {
  user.joystick.emit('game-over', { id: loserId });
};

const emitGameStart = (user) => {
  user.joystick.emit('game-start', { id: user.tank.board.id });
};

const receiveShoot = (shotTank) => {
  const shotUser = game.users.find(u => u.tank === shotTank);

  if (shotTank.invincible) {
    return;
  }
  console.log('shot received on tank', shotTank.board.id);

  shotTank.lives -= 1;
  emitLives(shotUser);
  if (shotTank.lives <= 0) {
    game.finished = true;
    shotTank.dead = true;
    console.log('tank died ', shotTank.board.id);
    console.log('game finished');
    game.users.forEach(user => {
      emitGameOver(user, shotTank.board.id)
      // tank.motors.stop();
    });
  }
  shotTank.invincible = true;
  setTimeout(() => {
    shotTank.invincible = false;
  }, 3500);
};

const mapJoystickToTank = ({ joystick, tank }) => {
  console.log(`mapped joystick ${joystick.id} to tank ${tank.board.id}`);
  tank.board.i2cConfig({ address: 0x0A });

  tank.shotSensor.on('change', () => {
    if (tank.shotSensor.value) {
      // Send acknowledge signal
      tank.board.i2cWrite(0x0A, [0x00, 0x01]);
      receiveShoot(tank);
    }
  });

  const fire = () => {
    tank.board.i2cWrite(0x0A, [0x01, 0x00]);
  };

  joystick.on('joystick.moved', (nipple) => {
    const backSpeed = MAX_SPEED;
    const { angle } = nipple;

    if (angle >= 45 && angle < 135) {
      tank.motors.left.fwd(MAX_SPEED);
      tank.motors.right.fwd(MAX_SPEED);
    }

    if (angle >= 315 || angle < 45) {
      tank.motors.left.fwd(MAX_SPEED);
      tank.motors.right.rev(backSpeed);
    }

    if (angle >= 225 && angle < 315) {
      tank.motors.left.rev(MAX_SPEED);
      tank.motors.right.rev(MAX_SPEED);
    }

    if (angle >= 135 && angle < 225) {
      tank.motors.left.rev(backSpeed);
      tank.motors.right.fwd(MAX_SPEED);
    }
  });

  joystick.on('joystick.stopped', tank.motors.stop);
  joystick.on('button0.clicked', fire);

  joystick.on('disconnect', () => {
    console.log(`User disconnected ${joystick.id}`);
    tank.motors.stop();
  });
};

const tankPorts = [3032];

const tanksPromise = getTanks(tankPorts);

joysticsStream.subscribe((joysticks) => {
  console.log('joysticks', joysticks.map(x => x.id));
  if (joysticks.length < tankPorts.length) {
    return;
  }
  game.users = [];
  [...joysticks].reverse().forEach((joystick, index) => {
    if (index >= tankPorts.length) {
      console.log('Too many joysticks connected, ommiting', joystick.id);
      joystick.emit('rejected');
      return;
    }

    tanksPromise.then((tanks) => {
      console.log('game starting')
      const tank = tanks[index];
      tank.lives = 3;
      tank.dead = false;
      tank.invincible = false;
      const user = {
        joystick,
        tank
      };
      emitGameStart(user);
      emitLives(user);
      game.users.push(user);
      console.log(`joystick: ${joystick.id} | tanks: ${tank.board.id}`);
      mapJoystickToTank(user);
    });
  });
});
