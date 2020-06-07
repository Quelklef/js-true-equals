
module.exports = { shared_tests, within };

class AssertionError extends Error { }

function assert(bool) {
  if (!bool) throw new AssertionError('assertion failed');
}

const context = [];
function within(name, body) {
  context.push(name);
  body();
  context.pop();
}

function test(name, body) {

  let result, err;

  try {
    body();
    result = 'success';
  } catch (e) {
    err = e;
    if (e instanceof AssertionError) {
      result = 'improper';
    } else {
      result = 'bug';
    }
  }

  // from https://stackoverflow.com/a/41407246/4608364
  const c_reset = "\x1b[0m";
  const c_bright = "\x1b[1m";
  const c_red = "\x1b[31m";
  const c_green = "\x1b[32m";

  const mark = { success: '+', improper: '-', bug: '!' }[result];
  const color = result === 'success' ? c_green : c_bright + c_red;
  const full_name = [...context, name].join(' > ');
  const text = `${color}[${mark}] ${full_name}${c_reset}`;

  if (result !== 'success') {
    console.log(text);
    if (err) console.error(err);
  }

}

function shared_tests(equals) {

  within('primitives', () => {

    test('null', () => {
      assert(equals(null, null));
    });

    test('undefined', () => {
      assert(equals(undefined, undefined));
    });

    test('number', () => {
      assert(equals(1, 1));
      assert(equals(-1, -1));
      assert(equals(3.75, 3.75));
      assert(equals(Number.INFINITY, Number.INFINITY));
      assert(equals(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY));
      assert(equals(Number.NaN, Number.NaN));
      assert(equals(+0, -0));
    });

    test('string', () => {
      assert(equals('', ''));
      assert(equals('string', 'string'));
      assert(!equals('', 0));
      assert(!equals('0', 0));
    });

    test('boolean', () => {
      assert(equals(false, false));
      assert(equals(true, true));

      assert(!equals(true, false));
    });

    test('symbol', () => {
      const A = Symbol();
      const B = Symbol();
      assert(equals(A, A));
      assert(!equals(A, B));
    });

    test('bigint', () => {
      assert(equals(0n, 0n));
      assert(equals(100n, 100n));
      assert(equals(-100n, -100n));

      assert(!equals(0n, 1n));
      assert(!equals(0n, 0));
      assert(!equals(0n, '0'));
    });

  });

  function testMonkeypatching(value_expression) {
    test('monkeypatched', () => {
      const make = new Function(`return ${value_expression}`);
      const thing = make();
      const rival = make();
      assert(equals(thing, rival));
      const prop_name = Symbol('monkeypatched');
      thing[prop_name] = 'prop val';
      assert(thing[prop_name] === 'prop val');
      assert(!equals(thing, rival));
    });
  }

  within('object types', () => {

    within('Number', () => {
      test('simple', () => {
        assert(equals(new Number(3.14), new Number(3.14)));
        assert(!equals(new Number(3.14), 3.14));
      });

      testMonkeypatching("new Number(3.14)");
    });

    within('String', () => {
      test('simple', () => {
        assert(equals(new String('string'), new String('string')));
        assert(!equals(new String('string'), 'string'));
      });

      testMonkeypatching("new String('imastring')");
    });

    within('Boolean', () => {
      test('simple', () => {
        assert(equals(new Boolean(true), new Boolean(true)));
        assert(equals(new Boolean(false), new Boolean(false)));
        assert(!equals(new Boolean(true), true));
        assert(!equals(new Boolean(false), false));
      });

      testMonkeypatching("new Boolean(true)");
    });

    within('Date', () => {
      test('simple', () => {
        assert(equals(new Date(0), new Date(0)));
      });

      testMonkeypatching("new Date()");
    });

    within('Function', () => {
      // no tests
    });

    within('Promise', () => {
      // no tests
    });

    within('RegExp', () => {
      test('simple', () => {
        assert(equals(/x/g, /x/g));
        assert(!equals(/x/g, /x/));
      });

      testMonkeypatching("/x/");
    });

  });

  within('container types', () => {

    within('Array', () => {

      test('empty', () => {
        assert(equals([], []));
      });

      test('nonempty', () => {
        const nonempty = [Number.INFINITY, 0, undefined, Symbol(), 12n];
        assert(equals([...nonempty], [...nonempty]));
      });

      test('nested', () => {
        const nested = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
        assert(equals([...nested], [...nested]));
      });

      test('cyclic', () => {
        const make = () => {
          const cyclic = ['before', undefined, 'after'];
          cyclic[1] = cyclic;
          return cyclic;
        };

        assert(equals(make(), make()));
      });

      test('diamond', () => {
        const make = () => {
          const child = ['im', 'child'];
          const diamond = ['before', child, 'between', child, 'after'];
          return diamond;
        };
        assert(equals(make(), make()));
      });

      test('sparse', () => {
        const make_sparse = () => [1,,3,,5];
        const make_dense = () => [1, undefined, 3, undefined, 5];
        assert(equals(make_sparse(), make_sparse()));
        assert(!equals(make_sparse(), make_dense()));
      });

      testMonkeypatching("[3, 1, 4]");

    });

    within('Map', () => {

      test('empty', () => {
        assert(equals(new Map(), new Map()));
      });

      test('nonempty', () => {
        const make = () => new Map([['ping', 'x'], ['y', 'pong']]);
        assert(equals(make(), make()));
      });

      test('nested', () => {
        const make = () => new Map([['m', new Map([['mx', 0]])]]);
        assert(equals(make(), make()));
      });

      test('cyclic', () => {
        const make = () => {
          const cyclic = new Map();
          cyclic.set('self', cyclic);
          return cyclic;
        };
        assert(equals(make(), make()));
      });

      test('diamond', () => {
        const make = () => {
          const child = new Map([['i am', 'child']]);
          const diamond = new Map([['a', child], ['b', child]]);
          return diamond;
        };
        assert(equals(make(), make()));
      });

      testMonkeypatching("new Map([['ping', 'x'], ['y', 'pong']])");

    });

    within('Set', () => {

      test('empty', () => {
        const empty = new Set([]);
        assert(equals(new Set(), new Set()));
      });

      test('nonempty', () => {
        const make = () => new Set([1, 2, 3]);
        assert(equals(make(), make()));
      });

      test('nested', () => {
        const make = () => {
          const child = new Set(['child']);
          const nested = new Set([child]);
          return nested;
        };
        assert(equals(make(), make()));
      });

      test('cyclic', () => {
        const make = () => {
          const cyclic = new Set();
          cyclic.add(cyclic);
          return cyclic;
        };
        assert(equals(make(), make()));
      });

      testMonkeypatching("new Set([1, 2, 3])");

    });

    test('WeakMap', () => {
      // no tests
    });

    test('WeakSet', () => {
      // no tests
    });

  });

  within('typed arrays et al', () => {

    within('ArrayBuffer', () => {
      test('simple', () => {
        assert(equals(new ArrayBuffer(32), new ArrayBuffer(32)));
        assert(!equals(new ArrayBuffer(32), new ArrayBuffer(64)));
      });

      testMonkeypatching("new ArrayBuffer(16)");
    });

    within('SharedArrayBuffer', () => {
      // no tests
    });

    within('DataView', () => {
      test('simple', () => {
        const make = (buffer_length, view_offset, view_byte_length) => {
          const buffer = new ArrayBuffer(buffer_length);
          const view = new DataView(buffer, view_offset, view_byte_length);
          return view;
        }
        assert(equals(make(32, 1, 16), make(32, 1, 16)));
        assert(!equals(make(64, 1, 16), make(32, 1, 16)));
        assert(!equals(make(32, 2, 16), make(32, 1, 16)));
        assert(!equals(make(32, 1, 12), make(32, 1, 16)));
      });

      testMonkeypatching("new DataView(new ArrayBuffer(16))");
    });

    function testTypedArray(constructor, sample_value) {
      within(constructor.name, () => {
        test('empty', () => {
          assert(equals(new constructor(32), new constructor(32)));
          assert(!equals(new constructor(64), new constructor(32)));
        });

        test('nonempty', () => {
          const make = (length, place_samples) => {
            const nonempty = new constructor(length);
            if (place_samples) {
              nonempty[0] = sample_value;
              nonempty[length - 1] = sample_value;
            }
            return nonempty;
          };
          assert(equals(make(32, true), make(32, true)));
          assert(!equals(make(64, true), make(32, true)));
          assert(!equals(make(32, false), make(32, true)));
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

    within('typed arrays', () => {
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
    within(constructor.prototype.name, () => {
      test('simple', () => {
        assert(equals(new constructor('message', 'filename', 50), new constructor('message', 'filename', 50)));
        // equality is not aware of location of error
        assert(equals(new constructor('message', '12345678', 12), new constructor('message', 'filename', 50)));
        assert(!equals(new constructor('1234567', 'filename', 50), new constructor('message', 'filename', 50)));
      });

      testMonkeypatching(`new ${constructor.name}('message', 'filename', 50)`);
    });
  }

  within('errors', () => {
    testError(Error);
    testError(EvalError);
    testError(RangeError);
    testError(ReferenceError);
    testError(SyntaxError);
    testError(TypeError);
    testError(URIError);
  });

  within('plain and custom objects', () => {

    test('empty', () => {
      assert(equals({}, {}));
    });

    test('nonempty', () => {
      const make = () => ({ left: 'right', up: 'down', red: 'blue' });
      assert(equals(make(), make()));
    });

    test('nested', () => {
      const make = () => ({ child: { val: 'val!' } });
      assert(equals(make(), make()));
    });

    test('cyclic', () => {
      const make = () => {
        const cyclic = { };
        cyclic.self = cyclic;
        return cyclic;
      };
      assert(equals(make(), make()));
    });

    test('diamond', () => {
      const make = () => {
        const child = { i_am: 'child' };
        const diamond = { left: child, right: child };
        return diamond;
      }
      assert(equals(make(), make()));
    });

    test('with non-string keys', () => {
      const key = Symbol();
      const make = () => ({ [key]: 'val' });
      assert(equals(make(), make()));
    });

    test('function prototype instances with no hierarchy', () => {
      function Pair(left, right) {
        this.left = left;
        this.right = right;
      }
      const make = () => new Pair(3, 4);
      assert(equals(make(), make()));
    });

    test('ES6 class instances with no hierarchy', () => {
      class Pair {
        constructor(left, right) {
          this.left = left;
          this.right = right;
        }
      }
      const pair = new Pair(3, 4);
      assert(equals(new Pair(3, 4), new Pair(3, 4)));
    });

    test('with prototype from Object.create', () => {
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

      assert(equals(obj_a, obj_b));
      assert(!equals(obj_b, obj_c));
      assert(!equals(obj_a, obj_d));
      assert(!equals(obj_d, obj_e));
    });

    test('with getters', () => {
      function getter() { return this.val; }

      const obj_a = { val: 'got' };
      Object.defineProperty(obj_a, 'getter', { get: getter });

      const obj_b = { val: 'got' };
      Object.defineProperty(obj_b, 'getter', { get: getter });

      const obj_c = { val: 'got', getter: 'got' };

      assert(equals(obj_a, obj_b));
      assert(!equals(obj_a, obj_c));
    });

  });

}

function true_equals_tests(package) {

  const { equals, custom_equals } = package;

  test('allows for custom equals', () => {

    const obj_a = {
      [custom_equals](other) {
        return other === 'a';
      }
    };

    assert(equals(obj_a, 'a'));
    assert(equals('a', obj_a));
    assert(!equals(obj_a, 'b'));
    assert(!equals('b', obj_a));

    class Class {
      [custom_equals](other) {
        return other === 'b';
      }
    }
    const obj_b = new Class();

    assert(equals(obj_b, 'b'));
    assert(equals('b', obj_b));
    assert(!equals(obj_b, 'a'));
    assert(!equals('a', obj_b));

    assert(!equals(obj_a, obj_b));
    assert(!equals(obj_b, obj_a));

  });

};

// if main module
if (!module.parent) {
  const true_equals = require('./equals.js');
  shared_tests(true_equals.equals);
  true_equals_tests(true_equals);
}
