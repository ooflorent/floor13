var GameScreen = {
  enter: function(canvas) {
    // Create game layers
    var stage = new Stage();
    var cameraLayer = stage.add(new DisplayObjectContainer());
    var hudLayer    = stage.add(new DisplayObjectContainer());
    var gameLayer   = cameraLayer.add(new DisplayObjectContainer());

    // Initialize rendering engine
    Buffer.init(__PW_GAME_WIDTH, __PW_GAME_HEIGHT, __PW_GAME_SCALE, canvas, stage);

    // Initialize game systems
    SystemManager.register(new KeyboardControlSystem());
    SystemManager.register(new PathFollowSystem());
    SystemManager.register(new MovementSystem());
    SystemManager.register(new DungeonCollisionSystem());
    SystemManager.register(new CameraSystem(cameraLayer));

    if (__PW_DEBUG) {
      var debugLayer = cameraLayer.add(new DisplayObjectContainer());
      //SystemManager.register(new BoundsRendererSystem(debugLayer));
    }

    SystemManager.register(new SpriteDirectionSystem());
    SystemManager.register(new SpriteRendererSystem(gameLayer));

    // Generate world
    var dungeon = EntityCreator.dungeon();
    var map = Pixelwars.c(dungeon, Dungeon.name);

    // Initialize path finder
    AStar.init(map.m, isWallTile);

    // Create game
    var game = EntityCreator.game(cameraLayer);

    // Create player
    var player = EntityCreator.player(map.prev);

    // Create enemies
    for (var i = map.e.length; i--;) {
      EntityCreator.skeleton(map.e[i]);
    }

    // Run the game
    SystemManager.start();
  },
  exit: function() {
    Buffer.clear();
    SystemManager.stop();
    SystemManager.clear();
    EventManager.clear();
    EntityManager.clear();
  }
};
