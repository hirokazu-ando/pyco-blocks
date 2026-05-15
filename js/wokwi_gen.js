// ===== Wokwi diagram.json ジェネレーター =====
// MicroPythonブロックを解析し、Wokwi互換の回路図JSONを生成する

(() => {
  'use strict';

  const PICO_GND = 'pico:GND.1';
  const PICO_3V3 = 'pico:3V3';
  const gp = pin => `pico:GP${pin}`;

  // ===== メイン生成関数 =====

  window.generateWokwiDiagram = function(workspace) {
    const parts = [
      { type: 'wokwi-pi-pico', id: 'pico', top: 0, left: 0, attrs: {} }
    ];
    const connections = [];
    const connSeen = new Set();
    const compMap = new Map();   // key → id
    const idCounters = {};

    function newId(base) {
      idCounters[base] = (idCounters[base] || 0) + 1;
      return base + idCounters[base];
    }

    function getOrCreate(key, type, attrs) {
      if (compMap.has(key)) return compMap.get(key);
      const idBase = type.replace('wokwi-', '').replace(/-/g, '_');
      const id = newId(idBase);
      compMap.set(key, id);
      parts.push({ type, id, top: 0, left: 0, attrs: attrs || {} });
      return id;
    }

    function wire(from, to, color) {
      const key = `${from}→${to}`;
      if (connSeen.has(key)) return;
      connSeen.add(key);
      connections.push([from, to, color, []]);
    }

    // ===== 部品ごとの接続ヘルパー =====

    function mkLed(pin) {
      const rid = getOrCreate(`res_p${pin}`, 'wokwi-resistor', { value: '220' });
      const lid = getOrCreate(`led_p${pin}`, 'wokwi-led', { color: 'red' });
      wire(gp(pin), `${rid}:1`, 'green');
      wire(`${rid}:2`, `${lid}:A`, 'green');
      wire(`${lid}:C`, PICO_GND, 'black');
    }

    function mkButton(pin) {
      const bid = getOrCreate(`btn_p${pin}`, 'wokwi-pushbutton', {});
      const rid = getOrCreate(`rpull_p${pin}`, 'wokwi-resistor', { value: '10000' });
      wire(PICO_3V3, `${bid}:1.l`, 'red');
      wire(`${bid}:2.r`, gp(pin), 'green');
      wire(`${bid}:2.r`, `${rid}:1`, 'green');
      wire(`${rid}:2`, PICO_GND, 'black');
    }

    function mkPot(pin) {
      const id = getOrCreate(`pot_p${pin}`, 'wokwi-potentiometer', {});
      wire(`${id}:VCC`, PICO_3V3, 'red');
      wire(`${id}:GND`, PICO_GND, 'black');
      wire(`${id}:SIG`, gp(pin), 'green');
    }

    function mkBuzzer(pin) {
      const id = getOrCreate(`buzz_p${pin}`, 'wokwi-buzzer', {});
      wire(gp(pin), `${id}:1`, 'green');
      wire(`${id}:2`, PICO_GND, 'black');
    }

    function mkSeg7(pinsStr) {
      const id = getOrCreate('seg7', 'wokwi-7segment', { common: 'cathode' });
      const pins = pinsStr.split(',').map(s => s.trim());
      ['A','B','C','D','E','F','G'].forEach((seg, i) => {
        if (pins[i]) wire(gp(pins[i]), `${id}:${seg}`, 'green');
      });
      wire(`${id}:COM`, PICO_GND, 'black');
    }

    function mkLcd(sda, scl) {
      const id = getOrCreate(`lcd_${sda}_${scl}`, 'wokwi-lcd1602', { pins: 'i2c' });
      wire(`${id}:SDA`, gp(sda), 'blue');
      wire(`${id}:SCL`, gp(scl), 'purple');
      wire(`${id}:VCC`, PICO_3V3, 'red');
      wire(`${id}:GND`, PICO_GND, 'black');
    }

    function mkServo(pin) {
      const id = getOrCreate(`servo_p${pin}`, 'wokwi-servo', {});
      wire(`${id}:GND`, PICO_GND, 'black');
      wire(`${id}:V+`,  PICO_3V3, 'red');
      wire(`${id}:PWM`, gp(pin), 'orange');
    }

    function mkL298n(in1, in2, en) {
      // chip-l298n は Wokwi カスタムチップ (wokwi.toml に依存追加が必要)
      const id = getOrCreate(`l298n_${in1}_${in2}`, 'chip-l298n', {});
      wire(gp(in1), `${id}:IN1`, 'green');
      wire(gp(in2), `${id}:IN2`, 'green');
      wire(`${id}:GND`, PICO_GND, 'black');
      wire('pico:VSYS', `${id}:VCC`, 'red');
      if (en !== null) wire(gp(en), `${id}:ENA`, 'orange');
    }

    function mkStepper(pinsStr) {
      const pins = pinsStr.split(',').map(s => s.trim());
      const drvId = getOrCreate(`uln2003_${pinsStr}`, 'wokwi-uln2003a', {});
      const motId = getOrCreate(`stepper_${pinsStr}`, 'wokwi-stepper-motor', {});
      ['IN1','IN2','IN3','IN4'].forEach((name, i) => {
        if (pins[i]) wire(gp(pins[i]), `${drvId}:${name}`, 'green');
      });
      wire(`${drvId}:VCC`, PICO_3V3, 'red');
      wire(`${drvId}:GND`, PICO_GND, 'black');
      // OUT1→A+, OUT2→A-, OUT3→B+, OUT4→B-
      [['OUT1','A+'],['OUT2','A-'],['OUT3','B+'],['OUT4','B-']].forEach(([out, mpin]) => {
        wire(`${drvId}:${out}`, `${motId}:${mpin}`, 'orange');
      });
    }

    function mkUltrasonic(trig, echo) {
      const id = getOrCreate(`hcsr04_${trig}_${echo}`, 'wokwi-hc-sr04', {});
      wire(`${id}:VCC`,  PICO_3V3, 'red');
      wire(`${id}:GND`,  PICO_GND, 'black');
      wire(`${id}:TRIG`, gp(trig), 'green');
      wire(`${id}:ECHO`, gp(echo), 'blue');
    }

    function mkDht(pin) {
      const id = getOrCreate(`dht_p${pin}`, 'wokwi-dht22', {});
      wire(`${id}:VCC`, PICO_3V3, 'red');
      wire(`${id}:GND`, PICO_GND, 'black');
      wire(`${id}:SDA`, gp(pin), 'green');
    }

    // ===== ブロックタイプ → ハンドラー =====

    const handlers = {
      pico_led_on:        b => mkLed(b.getFieldValue('PIN')),
      pico_led_off:       b => mkLed(b.getFieldValue('PIN')),
      pico_digital_write: b => mkLed(b.getFieldValue('PIN')),
      pico_pwm_write:     b => mkLed(b.getFieldValue('PIN')),
      pico_pwm_write_val: b => mkLed(b.getFieldValue('PIN')),

      pico_digital_read:      b => mkButton(b.getFieldValue('PIN')),
      pico_digital_read_val:  b => mkButton(b.getFieldValue('PIN')),

      pico_analog_read:     b => mkPot(b.getFieldValue('PIN')),
      pico_analog_read_val: b => mkPot(b.getFieldValue('PIN')),

      pico_buzzer_tone: b => mkBuzzer(b.getFieldValue('PIN')),
      pico_buzzer_stop: b => mkBuzzer(b.getFieldValue('PIN')),

      pico_7seg_show: b => mkSeg7(['A','B','C','D','E','F','G'].map(s => b.getFieldValue('PIN_' + s)).join(',')),

      pico_lcd_init: b => mkLcd(b.getFieldValue('SDA'), b.getFieldValue('SCL')),
      // pico_lcd_print / pico_lcd_clear はピン情報を持たないためスキップ

      pico_servo_angle: b => mkServo(b.getFieldValue('PIN')),

      pico_dcmotor_run:  b => mkL298n(b.getFieldValue('IN1'), b.getFieldValue('IN2'), b.getFieldValue('EN')),
      pico_dcmotor_stop: b => mkL298n(b.getFieldValue('IN1'), b.getFieldValue('IN2'), null),

      pico_stepper_step:  b => mkStepper(['IN1','IN2','IN3','IN4'].map(n => b.getFieldValue(n)).join(',')),
      pico_stepper_angle: b => mkStepper(['IN1','IN2','IN3','IN4'].map(n => b.getFieldValue(n)).join(',')),

      pico_ultrasonic_cm:     b => mkUltrasonic(b.getFieldValue('TRIG'), b.getFieldValue('ECHO')),
      pico_ultrasonic_cm_val: b => mkUltrasonic(b.getFieldValue('TRIG'), b.getFieldValue('ECHO')),

      pico_dht_read: b => mkDht(b.getFieldValue('PIN')),
    };

    // ===== ブロック走査 =====

    workspace.getAllBlocks(false)
      .filter(b => !b.isInsertionMarker())
      .forEach(b => {
        const h = handlers[b.type];
        if (h) h(b);
      });

    // ===== 自動レイアウト（Pico以外をグリッド配置）=====

    const nonPico = parts.filter(p => p.id !== 'pico');
    const COLS = 3, COL_W = 220, ROW_H = 200, LEFT0 = 260, TOP0 = 0;
    nonPico.forEach((p, i) => {
      p.top  = TOP0 + Math.floor(i / COLS) * ROW_H;
      p.left = LEFT0 + (i % COLS) * COL_W;
    });

    // L298N カスタムチップが含まれる場合は dependencies に追記
    const hasL298n = parts.some(p => p.type === 'chip-l298n');
    const deps = hasL298n
      ? { 'chip-l298n': 'github:drf5n/Wokwi-Chip-L298N@1.0.5' }
      : {};

    return {
      version: 1,
      author: 'PycoBlocks',
      editor: 'wokwi',
      parts: parts.map(({ type, id, top, left, attrs }) => ({ type, id, top, left, attrs })),
      connections,
      dependencies: deps,
      _notes: hasL298n ? ['L298N: wokwi.toml に "[parts] l298n = { path = \\"drf5n/Wokwi-Chip-L298N\\" }" を追加してください'] : undefined
    };
  };

})();
