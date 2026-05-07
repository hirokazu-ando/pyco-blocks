// =====================================================
// PycoBlocks Game Mode - pygame emulator for Skulpt
// =====================================================

(() => {
  'use strict';

  const PYGAME_JS = String.raw`var $builtinmodule = function(name) {
  'use strict';

  var Sk = globalThis.Sk;

  var KEY_MAP = {
    'ArrowRight': 275,
    'ArrowLeft':  276,
    'ArrowUp':    273,
    'ArrowDown':  274,
    'Space':       32,
    'Enter':       13,
    'KeyA': 97,  'KeyB': 98,  'KeyC': 99,  'KeyD': 100,
    'KeyE': 101, 'KeyF': 102, 'KeyG': 103, 'KeyH': 104,
    'KeyI': 105, 'KeyJ': 106, 'KeyK': 107, 'KeyL': 108,
    'KeyM': 109, 'KeyN': 110, 'KeyO': 111, 'KeyP': 112,
    'KeyQ': 113, 'KeyR': 114, 'KeyS': 115, 'KeyT': 116,
    'KeyU': 117, 'KeyV': 118, 'KeyW': 119, 'KeyX': 120,
    'KeyY': 121, 'KeyZ': 122,
    'Digit0': 48, 'Digit1': 49, 'Digit2': 50, 'Digit3': 51,
    'Digit4': 52, 'Digit5': 53, 'Digit6': 54, 'Digit7': 55,
    'Digit8': 56, 'Digit9': 57
  };

  var QUIT = 256;
  var KEYDOWN = 768;
  var KEYUP = 769;

  var keyState = {};    // { code: true/false }
  var eventQueue = [];  // { type, key }

  var mouseX = 0;
  var mouseY = 0;
  var mouseButtons = [false, false, false];
  var MOUSEBUTTONDOWN = 1025;
  var MOUSEBUTTONUP   = 1026;

  var _installedListeners = false;
  function ensureListeners() {
    if (_installedListeners) return;
    _installedListeners = true;

    window.addEventListener('keydown', function(e) {
      var code = (KEY_MAP[e.code] !== undefined) ? KEY_MAP[e.code] : e.keyCode;
      keyState[code] = true;
      eventQueue.push({ type: KEYDOWN, key: code });
      if (e.code && e.code.startsWith('Arrow')) e.preventDefault();
      if (e.code === 'Space') e.preventDefault();
    }, { passive: false });

    window.addEventListener('keyup', function(e) {
      var code = (KEY_MAP[e.code] !== undefined) ? KEY_MAP[e.code] : e.keyCode;
      keyState[code] = false;
      eventQueue.push({ type: KEYUP, key: code });
    }, { passive: true });

    window.addEventListener('mousemove', function(e) {
      var area = document.getElementById('game-canvas-area');
      if (!area) return;
      var cnv = area.querySelector('canvas');
      if (!cnv) { mouseX = e.clientX; mouseY = e.clientY; return; }
      var rect = cnv.getBoundingClientRect();
      var style = getComputedStyle(cnv);
      var bl = parseFloat(style.borderLeftWidth) || 0;
      var bt = parseFloat(style.borderTopWidth)  || 0;
      var br = parseFloat(style.borderRightWidth) || 0;
      var bb = parseFloat(style.borderBottomWidth)|| 0;
      var contentW = rect.width  - bl - br;
      var contentH = rect.height - bt - bb;
      var scaleX = contentW > 0 ? cnv.width  / contentW : 1;
      var scaleY = contentH > 0 ? cnv.height / contentH : 1;
      mouseX = Math.round((e.clientX - rect.left - bl) * scaleX);
      mouseY = Math.round((e.clientY - rect.top  - bt) * scaleY);
    }, { passive: true });

    window.addEventListener('mousedown', function(e) {
      if (e.button >= 0 && e.button <= 2) mouseButtons[e.button] = true;
      eventQueue.push({ type: MOUSEBUTTONDOWN, button: e.button });
    }, { passive: true });

    window.addEventListener('mouseup', function(e) {
      if (e.button >= 0 && e.button <= 2) mouseButtons[e.button] = false;
      eventQueue.push({ type: MOUSEBUTTONUP, button: e.button });
    }, { passive: true });
  }

  function colorToCSS(color) {
    if (typeof color === 'string') return color;
    // Skulpt文字列: v が JavaScript string → そのまま使う
    if (color && typeof color.v === 'string') return color.v;
    // Skulptタプル/リスト (r, g, b): v が JavaScript Array
    if (color && Array.isArray(color.v) && color.v.length >= 3) {
      var r = Sk.ffi.remapToJs(color.v[0]);
      var g = Sk.ffi.remapToJs(color.v[1]);
      var b = Sk.ffi.remapToJs(color.v[2]);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    }
    try { return String(Sk.ffi.remapToJs(color)); } catch(e) {}
    return '#ffffff';
  }

  function tuple2_to_js(t) {
    if (!t || !Array.isArray(t.v) || t.v.length < 2) return [0, 0];
    return [Sk.ffi.remapToJs(t.v[0]), Sk.ffi.remapToJs(t.v[1])];
  }

  function tuple4_to_js(t) {
    if (!t || !Array.isArray(t.v) || t.v.length < 4) return [0, 0, 0, 0];
    return [
      Sk.ffi.remapToJs(t.v[0]),
      Sk.ffi.remapToJs(t.v[1]),
      Sk.ffi.remapToJs(t.v[2]),
      Sk.ffi.remapToJs(t.v[3])
    ];
  }

  function makePyNamespace() {
    var ns = {};
    function toName(pyName) {
      return (typeof pyName === 'string') ? pyName : Sk.ffi.remapToJs(pyName);
    }
    ns.tp$getattr = function(pyName) {
      var name = toName(pyName);
      if (Object.prototype.hasOwnProperty.call(ns, name)) return ns[name];
      throw new Sk.builtin.AttributeError(name);
    };
    ns.tp$setattr = function(pyName, value) {
      var name = toName(pyName);
      ns[name] = value;
    };
    return ns;
  }

  function makeSurface(canvas) {
    var surface = makePyNamespace();
    surface._canvas = canvas;
    surface._ctx = canvas.getContext('2d');
    surface._width = canvas.width;
    surface._height = canvas.height;

    surface.fill = new Sk.builtin.func(function(color_py) {
      var css = colorToCSS(color_py);
      surface._ctx.save();
      surface._ctx.fillStyle = css;
      surface._ctx.fillRect(0, 0, surface._canvas.width, surface._canvas.height);
      surface._ctx.restore();
      return Sk.builtin.none.none$;
    });

    surface.blit = new Sk.builtin.func(function(src_surface_py, pos_py) {
      var src = src_surface_py;
      var pos = tuple2_to_js(pos_py);
      if (src && src._canvas) {
        surface._ctx.drawImage(src._canvas, pos[0], pos[1]);
      }
      return Sk.builtin.none.none$;
    });

    surface.get_rect = new Sk.builtin.func(function() {
      return Rect(Sk.ffi.remapToPy(0), Sk.ffi.remapToPy(0),
                  Sk.ffi.remapToPy(surface._canvas.width), Sk.ffi.remapToPy(surface._canvas.height));
    });

    surface.get_width = new Sk.builtin.func(function() {
      return Sk.ffi.remapToPy(surface._canvas.width);
    });

    surface.get_height = new Sk.builtin.func(function() {
      return Sk.ffi.remapToPy(surface._canvas.height);
    });

    return surface;
  }

  function Rect(x_py, y_py, w_py, h_py) {
    var obj = makePyNamespace();
    obj._isRect = true;
    obj.x = x_py; obj.y = y_py; obj.width = w_py; obj.height = h_py;

    obj.colliderect = new Sk.builtin.func(function(other) {
      var ax = Sk.ffi.remapToJs(obj.x), ay = Sk.ffi.remapToJs(obj.y);
      var aw = Sk.ffi.remapToJs(obj.width), ah = Sk.ffi.remapToJs(obj.height);
      var bx = Sk.ffi.remapToJs(other.x), by = Sk.ffi.remapToJs(other.y);
      var bw = Sk.ffi.remapToJs(other.width), bh = Sk.ffi.remapToJs(other.height);
      var hit = (ax < bx + bw) && (ax + aw > bx) && (ay < by + bh) && (ay + ah > by);
      return Sk.ffi.remapToPy(hit);
    });

    obj.collidepoint = new Sk.builtin.func(function(px_py, py_py) {
      var px = Sk.ffi.remapToJs(px_py), py = Sk.ffi.remapToJs(py_py);
      var ax = Sk.ffi.remapToJs(obj.x), ay = Sk.ffi.remapToJs(obj.y);
      var aw = Sk.ffi.remapToJs(obj.width), ah = Sk.ffi.remapToJs(obj.height);
      var hit = (px >= ax && px < ax + aw && py >= ay && py < ay + ah);
      return Sk.ffi.remapToPy(hit);
    });

    obj.union = new Sk.builtin.func(function(other) {
      var ax = Sk.ffi.remapToJs(obj.x), ay = Sk.ffi.remapToJs(obj.y);
      var aw = Sk.ffi.remapToJs(obj.width), ah = Sk.ffi.remapToJs(obj.height);
      var bx = Sk.ffi.remapToJs(other.x), by = Sk.ffi.remapToJs(other.y);
      var bw = Sk.ffi.remapToJs(other.width), bh = Sk.ffi.remapToJs(other.height);
      var left = Math.min(ax, bx), top = Math.min(ay, by);
      var right = Math.max(ax + aw, bx + bw), bottom = Math.max(ay + ah, by + bh);
      return Rect(Sk.ffi.remapToPy(left), Sk.ffi.remapToPy(top),
                  Sk.ffi.remapToPy(right - left), Sk.ffi.remapToPy(bottom - top));
    });

    obj.move = new Sk.builtin.func(function(dx_py, dy_py) {
      var dx = Sk.ffi.remapToJs(dx_py), dy = Sk.ffi.remapToJs(dy_py);
      return Rect(Sk.ffi.remapToPy(Sk.ffi.remapToJs(obj.x) + dx),
                  Sk.ffi.remapToPy(Sk.ffi.remapToJs(obj.y) + dy),
                  obj.width, obj.height);
    });

    obj.move_ip = new Sk.builtin.func(function(dx_py, dy_py) {
      var dx = Sk.ffi.remapToJs(dx_py), dy = Sk.ffi.remapToJs(dy_py);
      obj.x = Sk.ffi.remapToPy(Sk.ffi.remapToJs(obj.x) + dx);
      obj.y = Sk.ffi.remapToPy(Sk.ffi.remapToJs(obj.y) + dy);
      return Sk.builtin.none.none$;
    });

    Object.defineProperty(obj, 'centerx', {
      get: function() { return Sk.ffi.remapToPy(Sk.ffi.remapToJs(obj.x) + Sk.ffi.remapToJs(obj.width) / 2); },
      set: function(v) { obj.x = Sk.ffi.remapToPy(Sk.ffi.remapToJs(v) - Sk.ffi.remapToJs(obj.width) / 2); }
    });
    Object.defineProperty(obj, 'centery', {
      get: function() { return Sk.ffi.remapToPy(Sk.ffi.remapToJs(obj.y) + Sk.ffi.remapToJs(obj.height) / 2); },
      set: function(v) { obj.y = Sk.ffi.remapToPy(Sk.ffi.remapToJs(v) - Sk.ffi.remapToJs(obj.height) / 2); }
    });

    return obj;
  }

  var display = makePyNamespace();
  var event = makePyNamespace();
  var key = makePyNamespace();
  var mouse = makePyNamespace();
  var draw = makePyNamespace();
  var font = makePyNamespace();
  var image = makePyNamespace();
  var time = makePyNamespace();

  var _mainSurface = null;
  var _imageCache = {};
  var _fontCache = {};

  function ensureGameArea() {
    var area = document.getElementById('game-canvas-area');
    if (!area) return null;
    area.style.display = '';
    return area;
  }

  display.set_mode = new Sk.builtin.func(function(size_py) {
    ensureListeners();
    window.__pygameRunning = true;
    var area = ensureGameArea();
    if (!area) return Sk.builtin.none.none$;

    var size = tuple2_to_js(size_py);
    var w = size[0] || 480, h = size[1] || 320;

    var cnv = area.querySelector('canvas');
    if (!cnv) {
      cnv = document.createElement('canvas');
      cnv.className = 'pyco-game-canvas';
      area.appendChild(cnv);
    }
    cnv.width = w; cnv.height = h;
    _mainSurface = makeSurface(cnv);
    return _mainSurface;
  });

  display.set_caption = new Sk.builtin.func(function(title_py) {
    var title = Sk.ffi.remapToJs(title_py);
    var bar = document.getElementById('game-title-bar');
    if (bar) bar.textContent = title;
    return Sk.builtin.none.none$;
  });

  display.flip = new Sk.builtin.func(function() {
    return new Sk.misceval.promiseToSuspension(new Promise(function(resolve) {
      requestAnimationFrame(function() { resolve(Sk.builtin.none.none$); });
    }));
  });

  event.get = new Sk.builtin.func(function() {
    if (window.__pygameRunning === false) {
      eventQueue.push({ type: QUIT });
      window.__pygameRunning = true; // prevent duplicate QUIT events
    }
    var items = eventQueue.splice(0, eventQueue.length).map(function(e) {
      var obj = makePyNamespace();
      obj.type = Sk.ffi.remapToPy(e.type);
      if (e.key !== undefined) obj.key = Sk.ffi.remapToPy(e.key);
      return obj;
    });
    return new Sk.builtin.list(items);
  });

  key.get_pressed = new Sk.builtin.func(function() {
    var obj = makePyNamespace();
    obj.mp$subscript = function(k_py) {
      var k = Sk.ffi.remapToJs(k_py);
      return Sk.ffi.remapToPy(!!keyState[k]);
    };
    return obj;
  });

  mouse.get_pos = new Sk.builtin.func(function() {
    return new Sk.builtin.tuple([
      Sk.ffi.remapToPy(mouseX),
      Sk.ffi.remapToPy(mouseY)
    ]);
  });

  mouse.get_pressed = new Sk.builtin.func(function() {
    var obj = makePyNamespace();
    obj.mp$subscript = function(idx_py) {
      var i = Sk.ffi.remapToJs(idx_py);
      return Sk.ffi.remapToPy(!!mouseButtons[i]);
    };
    return obj;
  });

  draw.rect = new Sk.builtin.func(function(surface_py, color_py, rect_py, width_py) {
    var surface = surface_py;
    var rect = tuple4_to_js(rect_py);
    var width = width_py ? Sk.ffi.remapToJs(width_py) : 0;
    var css = colorToCSS(color_py);
    var ctx = surface._ctx;
    ctx.save();
    if (width && width > 0) {
      ctx.strokeStyle = css;
      ctx.lineWidth = width;
      ctx.strokeRect(rect[0], rect[1], rect[2], rect[3]);
    } else {
      ctx.fillStyle = css;
      ctx.fillRect(rect[0], rect[1], rect[2], rect[3]);
    }
    ctx.restore();
    return Sk.builtin.none.none$;
  });

  draw.circle = new Sk.builtin.func(function(surface_py, color_py, pos_py, radius_py, width_py) {
    var surface = surface_py;
    var pos = tuple2_to_js(pos_py);
    var r = Sk.ffi.remapToJs(radius_py);
    var width = width_py ? Sk.ffi.remapToJs(width_py) : 0;
    var css = colorToCSS(color_py);
    var ctx = surface._ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(pos[0], pos[1], r, 0, Math.PI * 2);
    if (width && width > 0) {
      ctx.strokeStyle = css;
      ctx.lineWidth = width;
      ctx.stroke();
    } else {
      ctx.fillStyle = css;
      ctx.fill();
    }
    ctx.restore();
    return Sk.builtin.none.none$;
  });

  draw.line = new Sk.builtin.func(function(surface_py, color_py, p1_py, p2_py, width_py) {
    var surface = surface_py;
    var p1 = tuple2_to_js(p1_py);
    var p2 = tuple2_to_js(p2_py);
    var w = width_py ? Sk.ffi.remapToJs(width_py) : 1;
    var css = colorToCSS(color_py);
    var ctx = surface._ctx;
    ctx.save();
    ctx.strokeStyle = css;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.stroke();
    ctx.restore();
    return Sk.builtin.none.none$;
  });

  function makeFont(size) {
    var f = makePyNamespace();
    f._size = size || 24;
    f.render = new Sk.builtin.func(function(text_py, antialias_py, color_py) {
      var text = Sk.ffi.remapToJs(text_py);
      var css = colorToCSS(color_py);
      var cnv = document.createElement('canvas');
      var ctx = cnv.getContext('2d');
      ctx.font = f._size + 'px sans-serif';
      var metrics = ctx.measureText(text);
      cnv.width = Math.max(1, Math.ceil(metrics.width));
      cnv.height = Math.max(1, Math.ceil(f._size * 1.4));
      ctx = cnv.getContext('2d');
      ctx.font = f._size + 'px sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillStyle = css;
      ctx.fillText(text, 0, 0);
      return makeSurface(cnv);
    });
    return f;
  }

  function getCachedFont(size) {
    var key = String(size || 24);
    if (!_fontCache[key]) {
      _fontCache[key] = makeFont(size);
    }
    return _fontCache[key];
  }
  font.SysFont = new Sk.builtin.func(function(name_py, size_py) {
    var size = Sk.ffi.remapToJs(size_py);
    return getCachedFont(size);
  });
  font.Font = new Sk.builtin.func(function(name_py, size_py) {
    var size = Sk.ffi.remapToJs(size_py);
    return getCachedFont(size);
  });

  image.load = new Sk.builtin.func(function(url_py) {
    var url = Sk.ffi.remapToJs(url_py);
    var base = (typeof document !== 'undefined' && document.baseURI) ? document.baseURI : (typeof window !== 'undefined' ? window.location.href : '');
    var resolved;
    try {
      resolved = base ? new URL(String(url), base).href : String(url);
    } catch (e) {
      resolved = String(url);
    }
    // 毎フレーム呼び出されても素早く返せるよう URL キーで Surface をキャッシュする。
    // キャッシュなしだと毎回 new Image() → onload → canvas 再構築が走り、画面が点滅する。
    if (_imageCache[resolved]) {
      return _imageCache[resolved];
    }
    return new Sk.misceval.promiseToSuspension(new Promise(function(resolve, reject) {
      var img = new Image();
      // http(s) の別ドメイン画像を Canvas に描くため CORS が必要な場合のみ付与する。
      // 相対パス・file:// では付与すると読み込み失敗することがある（同一オリジンは不要）。
      if (/^https?:\/\//i.test(resolved)) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = function() {
        var cnv = document.createElement('canvas');
        cnv.width = img.width || 64; cnv.height = img.height || 64;
        var ctx = cnv.getContext('2d');
        ctx.drawImage(img, 0, 0);
        // SVG の透明マージンを除去して (0,0) 配置が直感通りになるようにする
        if (/\.svg($|\?)/i.test(url)) {
          try {
            var d = ctx.getImageData(0, 0, cnv.width, cnv.height).data;
            var w = cnv.width, h = cnv.height;
            var x0 = w, y0 = h, x1 = 0, y1 = 0;
            for (var i = 0; i < d.length; i += 4) {
              if (d[i + 3] > 2) {
                var px = (i >> 2) % w, py = (i >> 2) / w | 0;
                if (px < x0) x0 = px; if (py < y0) y0 = py;
                if (px > x1) x1 = px; if (py > y1) y1 = py;
              }
            }
            if (x1 > x0 && y1 > y0) {
              var pad = 1;
              x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
              x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
              var cw = x1 - x0 + 1, ch = y1 - y0 + 1;
              var c2 = document.createElement('canvas');
              c2.width = cw; c2.height = ch;
              c2.getContext('2d').drawImage(cnv, x0, y0, cw, ch, 0, 0, cw, ch);
              cnv = c2;
            }
          } catch (e) { /* SecurityError 等は無視してクロップなしで続行 */ }
        }
        var surf = makeSurface(cnv);
        _imageCache[resolved] = surf;
        resolve(surf);
      };
      img.onerror = function() { reject(new Error('pygame.image.load failed: ' + url)); };
      img.src = resolved;
    }));
  });

  var transform = makePyNamespace();
  transform.scale = new Sk.builtin.func(function(surface_py, size_py) {
    var src = surface_py;
    if (!src || !src._canvas) return surface_py;
    var sz = tuple2_to_js(size_py);
    var nw = Math.max(1, Math.floor(sz[0]));
    var nh = Math.max(1, Math.floor(sz[1]));
    var cnv = document.createElement('canvas');
    cnv.width = nw; cnv.height = nh;
    var ctx = cnv.getContext('2d');
    try { ctx.imageSmoothingQuality = 'high'; } catch (e) {}
    ctx.drawImage(src._canvas, 0, 0, nw, nh);
    return makeSurface(cnv);
  });

  transform.flip = new Sk.builtin.func(function(surface_py, bx_py, by_py) {
    var src = surface_py;
    if (!src || !src._canvas) return surface_py;
    var bx = !!Sk.ffi.remapToJs(bx_py), by = !!Sk.ffi.remapToJs(by_py);
    var w = src._canvas.width, h = src._canvas.height;
    var cnv = document.createElement('canvas');
    cnv.width = w; cnv.height = h;
    var ctx = cnv.getContext('2d');
    ctx.translate(bx ? w : 0, by ? h : 0);
    ctx.scale(bx ? -1 : 1, by ? -1 : 1);
    ctx.drawImage(src._canvas, 0, 0);
    return makeSurface(cnv);
  });

  transform.rotate = new Sk.builtin.func(function(surface_py, angle_py) {
    var src = surface_py;
    if (!src || !src._canvas) return surface_py;
    var angleDeg = Sk.ffi.remapToJs(angle_py);
    if (!angleDeg) return surface_py;
    var w = src._canvas.width, h = src._canvas.height;
    var rad = angleDeg * Math.PI / 180;
    var cos = Math.abs(Math.cos(rad)), sin = Math.abs(Math.sin(rad));
    var nw = Math.ceil(w * cos + h * sin);
    var nh = Math.ceil(w * sin + h * cos);
    var cnv = document.createElement('canvas');
    cnv.width = nw; cnv.height = nh;
    var ctx = cnv.getContext('2d');
    try { ctx.imageSmoothingQuality = 'high'; } catch (e) {}
    ctx.translate(nw / 2, nh / 2);
    ctx.rotate(-rad);
    ctx.drawImage(src._canvas, -w / 2, -h / 2);
    return makeSurface(cnv);
  });

  function makeClock() {
    var clock = makePyNamespace();
    clock._last = performance.now();
    clock._fps = 0;
    clock.tick = new Sk.builtin.func(function(fps_py) {
      var fps = fps_py ? Sk.ffi.remapToJs(fps_py) : 60;
      fps = fps || 60;
      var ms = 1000 / fps;
      var now = performance.now();
      var dt = Math.max(1, now - clock._last);
      clock._fps = 1000 / dt;
      clock._last = now;
      return new Sk.misceval.promiseToSuspension(new Promise(function(resolve) {
        setTimeout(function() { resolve(Sk.builtin.none.none$); }, ms);
      }));
    });
    clock.get_fps = new Sk.builtin.func(function() {
      return Sk.ffi.remapToPy(clock._fps || 0);
    });
    return clock;
  }

  time.Clock = new Sk.builtin.func(function() { return makeClock(); });

  var _gameStartTime = null;
  time.get_ticks = new Sk.builtin.func(function() {
    if (_gameStartTime === null) _gameStartTime = performance.now();
    return Sk.ffi.remapToPy(Math.round(performance.now() - _gameStartTime));
  });

  // ===== mixer (Web Audio API でブラウザ実音再生) =====
  var mixer = makePyNamespace();
  var music = makePyNamespace();
  mixer.music = music;

  var _audioCtx = null;
  function _ensureAudioCtx() {
    if (!_audioCtx) {
      try {
        var Ctor = window.AudioContext || window.webkitAudioContext;
        if (Ctor) _audioCtx = new Ctor();
      } catch (e) {
        _audioCtx = null;
      }
    }
    if (_audioCtx && _audioCtx.state === 'suspended') {
      try { _audioCtx.resume(); } catch (e) {}
    }
    return _audioCtx;
  }

  function _resolveAudioUrl(url) {
    var base = (typeof document !== 'undefined' && document.baseURI) ? document.baseURI : (typeof window !== 'undefined' ? window.location.href : '');
    try {
      return base ? new URL(String(url), base).href : String(url);
    } catch (e) {
      return String(url);
    }
  }

  function _fetchAndDecode(url) {
    var ctx = _ensureAudioCtx();
    if (!ctx) return Promise.resolve(null);
    return fetch(_resolveAudioUrl(url))
      .then(function(res) {
        if (!res.ok) return null;
        return res.arrayBuffer();
      })
      .then(function(buf) {
        if (!buf) return null;
        return new Promise(function(resolve) {
          ctx.decodeAudioData(buf, function(decoded) { resolve(decoded); }, function() { resolve(null); });
        });
      })
      .catch(function() { return null; });
  }

  function makeSound(buffer) {
    var snd = makePyNamespace();
    snd._buffer = buffer;
    snd.play = new Sk.builtin.func(function() {
      var ctx = _ensureAudioCtx();
      if (ctx && snd._buffer) {
        try {
          var src = ctx.createBufferSource();
          src.buffer = snd._buffer;
          src.connect(ctx.destination);
          src.start(0);
        } catch (e) {}
      }
      return Sk.builtin.none.none$;
    });
    snd.stop = new Sk.builtin.func(function() {
      return Sk.builtin.none.none$;
    });
    snd.set_volume = new Sk.builtin.func(function() {
      return Sk.builtin.none.none$;
    });
    return snd;
  }

  mixer.Sound = new Sk.builtin.func(function(url_py) {
    var url = Sk.ffi.remapToJs(url_py);
    return new Sk.misceval.promiseToSuspension(
      _fetchAndDecode(url).then(function(buf) { return makeSound(buf); })
    );
  });

  mixer.init = new Sk.builtin.func(function() {
    _ensureAudioCtx();
    return Sk.builtin.none.none$;
  });

  mixer.quit = new Sk.builtin.func(function() {
    return Sk.builtin.none.none$;
  });

  var _musicState = { buffer: null, source: null };

  function _stopMusicSource() {
    if (_musicState.source) {
      try { _musicState.source.stop(); } catch (e) {}
      try { _musicState.source.disconnect(); } catch (e) {}
      _musicState.source = null;
    }
  }

  music.load = new Sk.builtin.func(function(url_py) {
    var url = Sk.ffi.remapToJs(url_py);
    return new Sk.misceval.promiseToSuspension(
      _fetchAndDecode(url).then(function(buf) {
        _stopMusicSource();
        _musicState.buffer = buf;
        return Sk.builtin.none.none$;
      })
    );
  });

  music.play = new Sk.builtin.func(function(loops_py) {
    var ctx = _ensureAudioCtx();
    var loops = (loops_py && loops_py !== Sk.builtin.none.none$) ? Sk.ffi.remapToJs(loops_py) : 0;
    if (ctx && _musicState.buffer) {
      try {
        _stopMusicSource();
        var src = ctx.createBufferSource();
        src.buffer = _musicState.buffer;
        src.loop = (loops === -1);
        src.connect(ctx.destination);
        src.start(0);
        _musicState.source = src;
      } catch (e) {}
    }
    return Sk.builtin.none.none$;
  });

  music.stop = new Sk.builtin.func(function() {
    _stopMusicSource();
    return Sk.builtin.none.none$;
  });

  music.pause = new Sk.builtin.func(function() {
    _stopMusicSource();
    return Sk.builtin.none.none$;
  });

  music.unpause = new Sk.builtin.func(function() {
    return Sk.builtin.none.none$;
  });

  music.set_volume = new Sk.builtin.func(function() {
    return Sk.builtin.none.none$;
  });

  music.get_busy = new Sk.builtin.func(function() {
    return Sk.ffi.remapToPy(_musicState.source !== null);
  });

  function init() {
    ensureListeners();
    window.__pygameRunning = true;
    _gameStartTime = performance.now();
    return Sk.builtin.none.none$;
  }

  function quit() {
    window.__pygameRunning = false;
    return Sk.builtin.none.none$;
  }

  var mod = {};
  mod.init = new Sk.builtin.func(init);
  mod.quit = new Sk.builtin.func(quit);

  mod.QUIT = Sk.ffi.remapToPy(QUIT);
  mod.KEYDOWN = Sk.ffi.remapToPy(KEYDOWN);
  mod.KEYUP = Sk.ffi.remapToPy(KEYUP);
  mod.MOUSEBUTTONDOWN = Sk.ffi.remapToPy(MOUSEBUTTONDOWN);
  mod.MOUSEBUTTONUP   = Sk.ffi.remapToPy(MOUSEBUTTONUP);

  mod.K_RIGHT  = Sk.ffi.remapToPy(275);
  mod.K_LEFT   = Sk.ffi.remapToPy(276);
  mod.K_UP     = Sk.ffi.remapToPy(273);
  mod.K_DOWN   = Sk.ffi.remapToPy(274);
  mod.K_SPACE  = Sk.ffi.remapToPy(32);
  mod.K_RETURN = Sk.ffi.remapToPy(13);

  mod.K_a = Sk.ffi.remapToPy(97);
  mod.K_b = Sk.ffi.remapToPy(98);
  mod.K_c = Sk.ffi.remapToPy(99);
  mod.K_d = Sk.ffi.remapToPy(100);
  mod.K_e = Sk.ffi.remapToPy(101);
  mod.K_f = Sk.ffi.remapToPy(102);
  mod.K_g = Sk.ffi.remapToPy(103);
  mod.K_h = Sk.ffi.remapToPy(104);
  mod.K_i = Sk.ffi.remapToPy(105);
  mod.K_j = Sk.ffi.remapToPy(106);
  mod.K_k = Sk.ffi.remapToPy(107);
  mod.K_l = Sk.ffi.remapToPy(108);
  mod.K_m = Sk.ffi.remapToPy(109);
  mod.K_n = Sk.ffi.remapToPy(110);
  mod.K_o = Sk.ffi.remapToPy(111);
  mod.K_p = Sk.ffi.remapToPy(112);
  mod.K_q = Sk.ffi.remapToPy(113);
  mod.K_r = Sk.ffi.remapToPy(114);
  mod.K_s = Sk.ffi.remapToPy(115);
  mod.K_t = Sk.ffi.remapToPy(116);
  mod.K_u = Sk.ffi.remapToPy(117);
  mod.K_v = Sk.ffi.remapToPy(118);
  mod.K_w = Sk.ffi.remapToPy(119);
  mod.K_x = Sk.ffi.remapToPy(120);
  mod.K_y = Sk.ffi.remapToPy(121);
  mod.K_z = Sk.ffi.remapToPy(122);

  mod.display = display;
  mod.event = event;
  mod.key = key;
  mod.mouse = mouse;
  mod.draw = draw;
  mod.font = font;
  mod.image = image;
  mod.transform = transform;
  mod.time = time;
  mod.mixer = mixer;

  mod.Rect = new Sk.builtin.func(function(x, y, w, h) { return Rect(x, y, w, h); });

  return mod;
};`;

  window.PycoPygame = {
    source: PYGAME_JS,
    installIntoSkulpt: function(Sk) {
      if (!Sk) return;
      // Skulpt stdlib layout: use Sk.builtinFiles['files']
      if (!Sk.builtinFiles) Sk.builtinFiles = { files: {} };
      if (!Sk.builtinFiles['files']) Sk.builtinFiles['files'] = {};
      Sk.builtinFiles['files']['pygame.js'] = PYGAME_JS;
      Sk.builtinFiles['files']['pygame/__init__.js'] = PYGAME_JS;
    }
  };
})();

