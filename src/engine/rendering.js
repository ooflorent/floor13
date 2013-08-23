function createCanvas() {
  return document.createElement('canvas');
}

function toRGBA(color) {
  return {
    a: 0xFF & (color >> 24),
    r: 0xFF & (color >> 16),
    g: 0xFF & (color >> 8),
    b: 0xFF & (color)
  };
}

function blendOverlay(a, b) {
  if (a > 128) {
    return a - (255 - a) + b * (255 - a) / 128;
  } else {
    return b * a / 128;
  }
}

function setPixel(imageData, x, y, color) {
  var i = (x + y * imageData.width) * 4;
  var data = imageData.data;
  var rgba = toRGBA(color);

  data[i]     = rgba.r;
  data[i + 1] = rgba.g;
  data[i + 2] = rgba.b;
  data[i + 3] = rgba.a;
}

function mosaic(scale) {
  var patternCanvas = createCanvas();
  var patternCtx = patternCanvas.getContext('2d');
  var patternData = patternCtx.createImageData(scale, scale);

  patternCanvas.width = patternCanvas.height = scale;

  var i;
  var n = scale - 1;

  setPixel(patternData, 0, 0, 0x33FFFFFF);
  setPixel(patternData, n, n, 0x33000000);

  for (i = 1; i < n; i++) {
    setPixel(patternData, i, 0, 0x33E0E0E0);
    setPixel(patternData, i, n, 0x33000000);
  }

  for (i = 1; i < n; i++) {
    setPixel(patternData, 0, i, 0x33FFFFFF);
    setPixel(patternData, n, i, 0x33000000);
  }

  return patternCanvas;
}

var Buffer = (function (engine) {
  var bufferCtx;
  var rendererCanvas;
  var rendererCtx;
  var width;
  var height;

  function renderObject(ctx, object) {
    if (!object._a) {
      return;
    }

    if (object instanceof DisplayObjectContainer) {
      var children = object._c;
      var i = children.length;

      while (i--) {
        renderObject(ctx, children[i]);
      }

      return;
    }

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, object._x, object._y);
    ctx.globalAlpha = object._a;

    if (object instanceof Sprite) {
      ctx.drawImage(object._i, 0, 0);
    } else if (object instanceof Graphics) {
      object._batch(ctx, object._color);
    }

    ctx.restore();
  }

  return {
    init: function(w, h, s, canvas) {
      canvas.width = w * s;
      canvas.height = w * s;

      bufferCtx = canvas.getContext('2d');
      bufferCtx.webkitImageSmoothingEnabled = bufferCtx.mozImageSmoothingEnabled = false;
      bufferCtx.setTransform(s, 0, 0, s, 0, 0);

      rendererCanvas = createCanvas(canvas);
      rendererCanvas.width = width = w;
      rendererCanvas.height = height = h;
      rendererCtx = rendererCanvas.getContext('2d');

      this.stage = new Stage();
    },
    render: function() {
      rendererCtx.setTransform(1, 0, 0, 1, 0, 0);
      rendererCtx.clearRect(0, 0, width, height);

      this.stage._transform();
      renderObject(rendererCtx, this.stage);

      bufferCtx.drawImage(rendererCanvas, 0, 0);
    }
  };
})();

var DisplayObject = (function() {
  function DisplayObject() {
    this.x = 0;
    this.y = 0;
    this.a = 1;

    this._x = 0;
    this._y = 0;
    this._a = 1;
    this._p = null;
  }

  define(DisplayObject.prototype, {
    _transform: function() {
      var parent = this._p;

      // Calculate effective position
      this._x = parent._x + this.x;
      this._y = parent._y + this.y;

      // Calculate effective alpha
      this._a = this.a * parent._a;
    }
  });

  return DisplayObject;
})();

var Graphics = (function(_super) {
  function Graphics(batch, color) {
    _super.call(this);
    this._batch = batch;
    this._color = color;
  }

  extend(Graphics, _super);
  return Graphics;
})(DisplayObject);

var Sprite = (function(_super) {
  function Sprite(img) {
    _super.call(this);
    this._img = img;
  }

  extend(Sprite, _super);
  return Sprite;
})(DisplayObject);

var DisplayObjectContainer = (function(_super) {
  function DisplayObjectContainer() {
    _super.call(this);
    this._c = [];
  }

  extend(DisplayObjectContainer, _super);
  define(DisplayObjectContainer.prototype, {
    add: function(child) {
      if (child._p) {
        child._p.remove(child);
      }

      this._c.push(child);
      child._p = this;
    },
    remove: function(child) {
      var children = this._c;
      var i = children.indexOf(child);
      if (i >= 0) {
        children.splice(i, 1);
        child._p = null;
      }
    },
    _transform: function() {
      _super.prototype._transform.call(this);

      var children = this._c;
      var i = children.length;

      while (i--) {
        children[i]._transform();
      }
    }
  });

  return DisplayObjectContainer;
})(DisplayObject);

var Stage = (function(_super) {
  function Stage() {
    _super.call(this);
  }

  extend(Stage, _super);
  define(Stage.prototype, {
    _transform: function() {
      var children = this._c;
      var i = children.length;

      while (i--) {
        children[i]._transform();
      }
    }
  });

  return Stage;
})(DisplayObjectContainer);
