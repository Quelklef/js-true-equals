
const assert = require('assert');

const { equals, custom_equals } = require('./equals.js');

describe('primitives', () => {

  it('null', () => {
    assert.ok(equals(null, null));
  });

  it('undefined', () => {
    assert.ok(equals(undefined, undefined));
  });

  it('number', () => {
    assert.ok(equals(1, 1));
    assert.ok(equals(-1, -1));
    assert.ok(equals(3.75, 3.75));
    assert.ok(equals(Number.INFINITY, Number.INFINITY));
    assert.ok(equals(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY));
    assert.ok(equals(Number.NaN, Number.NaN));
    assert.ok(equals(+0, -0));
  });

  it('string', () => {
    assert.ok(equals('', ''));
    assert.ok(equals('string', 'string'));
    assert.ok(!equals('', 0));
    assert.ok(!equals('0', 0));
  });

  it('boolean', () => {
    assert.ok(equals(false, false));
    assert.ok(equals(true, true));

    assert.ok(!equals(true, false));
  });

  it('symbol', () => {
    const A = Symbol();
    const B = Symbol();
    assert.ok(equals(A, A));
    assert.ok(!equals(A, B));
  });

  it('bigint', () => {
    assert.ok(equals(0n, 0n));
    assert.ok(equals(100n, 100n));
    assert.ok(equals(-100n, -100n));

    assert.ok(!equals(0n, 1n));
    assert.ok(!equals(0n, 0));
    assert.ok(!equals(0n, '0'));
  });

});

function testMonkeypatching(value_expression) {
  it('monkeypatched', () => {
    const make = new Function(`return ${value_expression}`);
    const thing = make();
    const rival = make();
    assert.ok(equals(thing, rival));
    const prop_name = Symbol('monkeypatched');
    thing[prop_name] = 'prop val';
    assert.ok(thing[prop_name] === 'prop val');
    assert.ok(!equals(thing, rival));
  });
}

describe('object types', () => {

  describe('Number', () => {
    it('simple', () => {
      assert.ok(equals(new Number(3.14), new Number(3.14)));
      assert.ok(!equals(new Number(3.14), 3.14));
    });

    testMonkeypatching("new Number(3.14)");
  });

  describe('String', () => {
    it('simple', () => {
      assert.ok(equals(new String('string'), new String('string')));
      assert.ok(!equals(new String('string'), 'string'));
    });

    testMonkeypatching("new String('imastring')");
  });

  describe('Boolean', () => {
    it('simple', () => {
      assert.ok(equals(new Boolean(true), new Boolean(true)));
      assert.ok(equals(new Boolean(false), new Boolean(false)));
      assert.ok(!equals(new Boolean(true), true));
      assert.ok(!equals(new Boolean(false), false));
    });

    testMonkeypatching("new Boolean(true)");
  });

  describe('Date', () => {
    it('simple', () => {
      assert.ok(equals(new Date(0), new Date(0)));
    });

    testMonkeypatching("new Date()");
  });

  describe('Function', () => {
    // no tests
  });

  describe('Promise', () => {
    // no tests
  });

  describe('RegExp', () => {
    it('simple', () => {
      assert.ok(equals(/x/g, /x/g));
      assert.ok(!equals(/x/g, /x/));
    });

    testMonkeypatching("/x/");
  });

});

describe('container types', () => {

  describe('Array', () => {

    it('empty', () => {
      assert.ok(equals([], []));
    });

    it('nonempty', () => {
      const nonempty = [Number.INFINITY, 0, undefined, Symbol(), 12n];
      assert.ok(equals([...nonempty], [...nonempty]));
    });

    it('nested', () => {
      const nested = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
      assert.ok(equals([...nested], [...nested]));
    });

    it('cyclic', () => {
      const make = () => {
        const cyclic = ['before', undefined, 'after'];
        cyclic[1] = cyclic;
        return cyclic;
      };

      assert.ok(equals(make(), make()));
    });

    it('diamond', () => {
      const make = () => {
        const child = ['im', 'child'];
        const diamond = ['before', child, 'between', child, 'after'];
        return diamond;
      };
      assert.ok(equals(make(), make()));
    });

    it('sparse', () => {
      const make_sparse = () => [1,,3,,5];
      const make_dense = () => [1, undefined, 3, undefined, 5];
      assert.ok(equals(make_sparse(), make_sparse()));
      assert.ok(!equals(make_sparse(), make_dense()));
    });

    testMonkeypatching("[3, 1, 4]");

  });

  describe('Map', () => {

    it('empty', () => {
      assert.ok(equals(new Map(), new Map()));
    });

    it('nonempty', () => {
      const make = () => new Map([['ping', 'x'], ['y', 'pong']]);
      assert.ok(equals(make(), make()));
    });

    it('nested', () => {
      const make = () => new Map([['m', new Map([['mx', 0]])]]);
      assert.ok(equals(make(), make()));
    });

    it('cyclic', () => {
      const make = () => {
        const cyclic = new Map();
        cyclic.set('self', cyclic);
        return cyclic;
      };
      assert.ok(equals(make(), make()));
    });

    it('diamond', () => {
      const make = () => {
        const child = new Map([['i am', 'child']]);
        const diamond = new Map([['a', child], ['b', child]]);
        return diamond;
      };
      assert.ok(equals(make(), make()));
    });

    testMonkeypatching("new Map([['ping', 'x'], ['y', 'pong']])");

  });

  describe('Set', () => {

    it('empty', () => {
      const empty = new Set([]);
      assert.ok(equals(new Set(), new Set()));
    });

    it('nonempty', () => {
      const make = () => new Set([1, 2, 3]);
      assert.ok(equals(make(), make()));
    });

    it('nested', () => {
      const make = () => {
        const child = new Set(['child']);
        const nested = new Set([child]);
        return nested;
      };
      assert.ok(equals(make(), make()));
    });

    it('cyclic', () => {
      const make = () => {
        const cyclic = new Set();
        cyclic.add(cyclic);
        return cyclic;
      };
      assert.ok(equals(make(), make()));
    });

    testMonkeypatching("new Set([1, 2, 3])");

  });

  it('WeakMap', () => {
    // no tests
  });

  it('WeakSet', () => {
    // no tests
  });

});

describe('typed arrays et al', () => {

  describe('ArrayBuffer', () => {
    it('simple', () => {
      assert.ok(equals(new ArrayBuffer(32), new ArrayBuffer(32)));
      assert.ok(!equals(new ArrayBuffer(32), new ArrayBuffer(64)));
    });

    testMonkeypatching("new ArrayBuffer(16)");
  });

  describe('SharedArrayBuffer', () => {
    // no tests
  });

  describe('DataView', () => {
    it('simple', () => {
      const make = (buffer_length, view_offset, view_byte_length) => {
        const buffer = new ArrayBuffer(buffer_length);
        const view = new DataView(buffer, view_offset, view_byte_length);
        return view;
      }
      assert.ok(equals(make(32, 1, 16), make(32, 1, 16)));
      assert.ok(!equals(make(64, 1, 16), make(32, 1, 16)));
      assert.ok(!equals(make(32, 2, 16), make(32, 1, 16)));
      assert.ok(!equals(make(32, 1, 12), make(32, 1, 16)));
    });

    testMonkeypatching("new DataView(new ArrayBuffer(16))");
  });

  function testTypedArray(constructor, sample_value) {
    describe(constructor.name, () => {
      it('empty', () => {
        assert.ok(equals(new constructor(32), new constructor(32)));
        assert.ok(!equals(new constructor(64), new constructor(32)));
      });

      it('nonempty', () => {
        const make = (length, place_samples) => {
          const nonempty = new constructor(length);
          if (place_samples) {
            nonempty[0] = sample_value;
            nonempty[length - 1] = sample_value;
          }
          return nonempty;
        };
        assert.ok(equals(make(32, true), make(32, true)));
        assert.ok(!equals(make(64, true), make(32, true)));
        assert.ok(!equals(make(32, false), make(32, true)));
      });

      testMonkeypatching(
        `(() => {
          const array = new ${constructor.name}(32);
          const val = ${sample_value + (constructor.name.includes('Big') ? 'n' : '')}
          array[0]  = val;
          array[15] = val;
          array[31] = val;
          return array;
        })()`
      );
    });
  }

  describe('typed arrays', () => {
    testTypedArray( BigInt64Array     , 12n );
    testTypedArray( BigUint64Array    , 12n );
    testTypedArray( Float32Array      , 3.1 );
    testTypedArray( Float64Array      , 3.1 );
    testTypedArray( Int8Array         , 120 );
    testTypedArray( Int16Array        , 120 );
    testTypedArray( Int32Array        , 120 );
    testTypedArray( Uint8Array        , 120 );
    testTypedArray( Uint8ClampedArray , 120 );
    testTypedArray( Uint16Array       , 120 );
    testTypedArray( Uint32Array       , 120 );
  });

});

function testError(constructor) {
  describe(constructor.prototype.name, () => {
    it('simple', () => {
      assert.ok(equals(new constructor('message', 'filename', 50), new constructor('message', 'filename', 50)));
      // equality is not aware of location of error
      assert.ok(equals(new constructor('message', '12345678', 12), new constructor('message', 'filename', 50)));
      assert.ok(!equals(new constructor('1234567', 'filename', 50), new constructor('message', 'filename', 50)));
    });

    testMonkeypatching(`new ${constructor.name}('message', 'filename', 50)`);
  });
}

describe('errors', () => {
  testError(Error);
  testError(EvalError);
  testError(RangeError);
  testError(ReferenceError);
  testError(SyntaxError);
  testError(TypeError);
  testError(URIError);
});

describe('plain and custom objects', () => {

  it('empty', () => {
    assert.ok(equals({}, {}));
  });

  it('nonempty', () => {
    const make = () => ({ left: 'right', up: 'down', red: 'blue' });
    assert.ok(equals(make(), make()));
  });

  it('nested', () => {
    const make = () => ({ child: { val: 'val!' } });
    assert.ok(equals(make(), make()));
  });

  it('cyclic', () => {
    const make = () => {
      const cyclic = { };
      cyclic.self = cyclic;
      return cyclic;
    };
    assert.ok(equals(make(), make()));
  });

  it('diamond', () => {
    const make = () => {
      const child = { i_am: 'child' };
      const diamond = { left: child, right: child };
      return diamond;
    }
    assert.ok(equals(make(), make()));
  });

  it('with non-string keys', () => {
    const key = Symbol();
    const make = () => ({ [key]: 'val' });
    assert.ok(equals(make(), make()));
  });

  it('function prototype instances with no hierarchy', () => {
    function Pair(left, right) {
      this.left = left;
      this.right = right;
    }
    const make = () => new Pair(3, 4);
    assert.ok(equals(make(), make()));
  });

  it('ES6 class instances with no hierarchy', () => {
    class Pair {
      constructor(left, right) {
        this.left = left;
        this.right = right;
      }
    }
    const pair = new Pair(3, 4);
    assert.ok(equals(new Pair(3, 4), new Pair(3, 4)));
  });

  it('with prototype from Object.create', () => {
    const proto = {
      delimiter: ', ',
      toString() {
        return this.items.join(this.delimiter);
      }
    };

    const obj_a = Object.create(proto);
    obj_a.items = [1, 2, 3];

    const obj_b = Object.create(proto);
    obj_b.items = [1, 2, 3];

    const obj_c = Object.create(proto);
    obj_c.items = [1, 2, 3, 4];

    const obj_d = Object.create({ ...proto, delimiter: ' & ' });
    obj_d.items = [1, 2, 3];

    const obj_e = Object.create({ ...proto, delimiter: ' & ' });
    obj_e.items = [1, 2, 3];

    assert.ok(equals(obj_a, obj_b));
    assert.ok(!equals(obj_b, obj_c));
    assert.ok(!equals(obj_a, obj_d));
    assert.ok(!equals(obj_d, obj_e));
  });

  it('with getters', () => {
    function getter() { return this.val; }

    const obj_a = { val: 'got' };
    Object.defineProperty(obj_a, 'getter', { get: getter });

    const obj_b = { val: 'got' };
    Object.defineProperty(obj_b, 'getter', { get: getter });

    const obj_c = { val: 'got', getter: 'got' };

    assert.ok(equals(obj_a, obj_b));
    assert.ok(!equals(obj_a, obj_c));
  });

});

it('allows for custom equals', () => {

  const obj_a = {
    [custom_equals](other) {
      return other === 'a';
    }
  };

  assert.ok(equals(obj_a, 'a'));
  assert.ok(equals('a', obj_a));
  assert.ok(!equals(obj_a, 'b'));
  assert.ok(!equals('b', obj_a));

  class Class {
    [custom_equals](other) {
      return other === 'b';
    }
  }
  const obj_b = new Class();

  assert.ok(equals(obj_b, 'b'));
  assert.ok(equals('b', obj_b));
  assert.ok(!equals(obj_b, 'a'));
  assert.ok(!equals('a', obj_b));

  assert.ok(!equals(obj_a, obj_b));
  assert.ok(!equals(obj_b, obj_a));

});

