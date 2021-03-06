
module.exports = { };

function primitive(value) {
  return typeof value !== 'object' || value === null;
}

// Do the two values have equal properties?
function props_eq(thing, rival, equals, ignore_keys = undefined) {

  /*

  Thus function is essentially:
    - if they don't have the same ownKeys, they're not equal
    - if they have different object descriptors for any key, they're not equal
    - if they have different property values for any key, they're not equal
    - otherwise, they're equal

  ---

  This function is forced to exhibit a degree of inflexibility. In particular,
  it will not perform a full equality check for the results of Reflect.ownKeys
  or of Object.getOwnPropertyDescriptor; instead, it will assume that these values
  are well-behaved. (They always are, except in the case of Proxies.)

  The reason for this is that we /can't/ perform a full equality check on these
  things. Let's consider if we did. We'd have a line like

    [*] if (!equals(Reflect.ownKeys(thing), Reflect.ownKeys(rival)) return false;

  that equals call would call props_eq on the keys arrays, which would
  reach [*], which would call props_eq on the keys arrays, which would
  reach [*], which would call props_eq on the keys arrays, which would
  reach [*], which would call props_eq on the keys arrays, which would ...

  If we tried to do full equality on the keys or descriptors, we'd loop infinitely.
  Instead, I chose to just assume that nobody is abusing Proxies *that* badly.

  */

  const thing_keys = Reflect.ownKeys(thing);
  const rival_keys = Reflect.ownKeys(rival);

  if (thing_keys.length !== rival_keys.length)
    return false;
  for (const thing_key of thing_keys)
    if (!rival_keys.includes(thing_key))
      return false;
  const keys = thing_keys;

  for (const key of keys) {

    if (ignore_keys && ignore_keys.includes(key))
      continue;

    const thing_property_descriptor = Object.getOwnPropertyDescriptor(thing, key);
    const rival_property_descriptor = Object.getOwnPropertyDescriptor(rival, key);

    if (
         thing_property_descriptor === undefined && rival_property_descriptor !== undefined
      || thing_property_descriptor !== undefined && rival_property_descriptor === undefined
      || thing_property_descriptor.configurable !== rival_property_descriptor.configurable
      || thing_property_descriptor.enumerable   !== rival_property_descriptor.enumerable
      || thing_property_descriptor.writable     !== rival_property_descriptor.writable
      || thing_property_descriptor.get          !== rival_property_descriptor.get
      || thing_property_descriptor.set          !== rival_property_descriptor.set
    )
      return false;

    // These will be undefined if the property is a getter/setter
    const thing_property_value = thing_property_descriptor.value;
    const rival_property_value = rival_property_descriptor.value;

    if (!equals(thing_property_value, rival_property_value))
      return false;
  }

  return true;

}

// Some types must be handled specially
// (For instance if they have any internal slots)
// I've taken this list from the list of well-known intrinsic objects (https://tc39.es/ecma262/#sec-well-known-intrinsic-objects)
// This may be overkill, but it will probably most needed cases
const testers = new Map();

// == BUILTIN TESTERS == //

testers.set(Array.prototype, function(thing, rival, equals) {
  return props_eq(thing, rival, equals);
});

testers.set(Boolean.prototype, function(thing, rival, equals) {
  return !!thing === !!rival && props_eq(thing, rival, equals);
});

testers.set(Date.prototype, function(thing, rival, equals) {
  return thing.toISOString() === rival.toISOString() && props_eq(thing, rival, equals);
});

testers.set(Function.prototype, function(thing, rival, equals) {
  // Structural equality for functions is not possible
  return thing === rival;
});

if (typeof Map !== 'undefined')
testers.set(Map.prototype, function(thing, rival, equals) {

  if (thing.size !== rival.size)
    return false;

  const rival_keys = [...rival.keys()];
  for (const thing_key of thing.keys()) {

    let found_matching_rival_key, matching_rival_key;

    if (primitive(thing_key)) {
      found_matching_rival_key = rival.has(thing_key);
      matching_rival_key = thing_key;
    } else {
      found_matching_rival_key = false;
      for (const rival_key of rival_keys) {
        if (equals(thing_key, rival_key)) {
          found_matching_rival_key = true;
          matching_rival_key = rival_key;
          break;
        }
      }
    }

    if (!found_matching_rival_key) {
      return false;
    } else {
      const thing_got = thing.get(thing_key);
      const rival_got = rival.get(matching_rival_key);
      if (!equals(thing_got, rival_got))
        return false;
    }

  }

  if (!props_eq(thing, rival, equals))
    return false;

  return true;

});

testers.set(Number.prototype, function(thing, rival, equals) {
  return +thing === +rival && props_eq(thing, rival, equals);
});

testers.set(Object.prototype, function(thing, rival, equals) {
  return props_eq(thing, rival, equals);
});

if (typeof Promise !== 'undefined')
testers.set(Promise.prototype, function(thing, rival, equals) {
  // Structural equality for promises is not possible
  return thing === rival;
});

testers.set(RegExp.prototype, function(thing, rival, equals) {

  if (
       thing.lastIndex  !== rival.lastIndex
    || thing.dotAll     !== rival.dotAll
    || thing.flags      !== rival.flags
    || thing.global     !== rival.global
    || thing.ignoreCase !== rival.ignoreCase
    || thing.multiline  !== rival.multiline
    || thing.source     !== rival.source
    || thing.sticky     !== rival.sticky
    || thing.unicode    !== rival.unicode
  )
    return false;

  if (!props_eq(thing, rival, equals))
    return false;

  return true;

});

if (typeof Set !== 'undefined')
testers.set(Set.prototype, function(thing, rival, equals) {

  if (thing.size !== rival.size)
    return false;

  const rival_items = [...rival];
  for (const thing_item of thing) {

    const rival_has_item =
      primitive(thing_item)
        ? rival.has(thing_item)
        : rival_items.some(rival_item => equals(thing_item, rival_item))

    if (!rival_has_item)
      return false;

  }

  if (!props_eq(thing, rival, equals))
    return false;

  return true;

});

testers.set(String.prototype, function(thing, rival, equals) {
  return '' + thing === '' + rival && props_eq(thing, rival, equals);
});

if (typeof WeakMap !== 'undefined')
testers.set(WeakMap.prototype, function(thing, rival, equals) {
  // Structural equality for WeakMaps is not possible
  return thing === rival;
});

if (typeof WeakSet !== 'undefined')
testers.set(WeakSet.prototype, function(thing, rival, equals) {
  // Structural equality for WeakSets is not possible
  return thing === rival;
});

// == TYPED ARRAYS ET AL == //

function typed_array_eq(thing, rival, equals) {

  if (thing.length !== rival.length)
    return false;
  const length = thing.length;

  for (let i = 0; i < length; i++)
    if (thing[i] !== rival[i])
      return false;

  if (!props_eq(thing, rival, equals))
    return false;

  return true;

}

if (typeof ArrayBuffer !== 'undefined')
testers.set(ArrayBuffer.prototype, function(thing, rival, equals) {
  if (!props_eq(thing, rival, equals))
    return false;

  const thing_view = new Int8Array(thing);
  const rival_view = new Int8Array(rival);
  return testers.get(Int8Array.prototype)(thing_view, rival_view, equals);
});

if (typeof SharedArrayBuffer !== 'undefined')
testers.set(SharedArrayBuffer.prototype, function(thing, rival, equals) {
  // Structural equality for SharedArrayBuffers seems to be impossible
  return thing === rival;
});

if (typeof DataView !== 'undefined')
testers.set(DataView.prototype, function(thing, rival, equals) {

  if (thing.byteOffset !== rival.byteOffset || thing.byteLength !== rival.byteLength)
    return false;

  if (!testers.get(ArrayBuffer.prototype)(thing.buffer, rival.buffer, equals))
    return false;

  if (!props_eq(thing, rival, equals))
    return false;

  return true;

});

if (typeof BigInt64Array     !== 'undefined') testers.set( BigInt64Array.prototype     , typed_array_eq );
if (typeof BigUint64Array    !== 'undefined') testers.set( BigUint64Array.prototype    , typed_array_eq );
if (typeof Float32Array      !== 'undefined') testers.set( Float32Array.prototype      , typed_array_eq );
if (typeof Float64Array      !== 'undefined') testers.set( Float64Array.prototype      , typed_array_eq );
if (typeof Int8Array         !== 'undefined') testers.set( Int8Array.prototype         , typed_array_eq );
if (typeof Int16Array        !== 'undefined') testers.set( Int16Array.prototype        , typed_array_eq );
if (typeof Int32Array        !== 'undefined') testers.set( Int32Array.prototype        , typed_array_eq );
if (typeof Uint8Array        !== 'undefined') testers.set( Uint8Array.prototype        , typed_array_eq );
if (typeof Uint8ClampedArray !== 'undefined') testers.set( Uint8ClampedArray.prototype , typed_array_eq );
if (typeof Uint16Array       !== 'undefined') testers.set( Uint16Array.prototype       , typed_array_eq );
if (typeof Uint32Array       !== 'undefined') testers.set( Uint32Array.prototype       , typed_array_eq );

// == ERRORS == //

function error_eq(thing, rival, equals) {

  if (
       thing.name       !== rival.name
    || thing.message    !== rival.message
  )
    return false;

  if (!props_eq(thing, rival, equals, ['stack']))
    return false;

  return true;

}

testers.set( Error.prototype          , error_eq );
testers.set( EvalError.prototype      , error_eq );
testers.set( RangeError.prototype     , error_eq );
testers.set( ReferenceError.prototype , error_eq );
testers.set( SyntaxError.prototype    , error_eq );
testers.set( TypeError.prototype      , error_eq );
testers.set( URIError.prototype       , error_eq );

const _Symbol = typeof Symbol === 'undefined' ? class Symbol { } : Symbol;

module.exports.equals =
function outer_equals(thing, rival) {

  // To hndle cyclic and other tricky structures, we'll cache what we've "already seen"
  // and compare via identity insted of structure if something's in the cache.
  // Note that we only store certiain values, like Arrays or plain object
  const thing_seen = typeof WeakSet !== 'undefined' ? new WeakSet() : new Set();
  const rival_seen = typeof WeakSet !== 'undefind' ? new WeakSet() : new Set();

  return equals(thing, rival);

  // Actual algorithm implementation
  function equals(thing, rival) {

    if (Number.isNaN(thing) && Number.isNaN(rival))
      return true;

    if (primitive(thing) || primitive(rival))
      return thing === rival;

    // Return early on cache hit
    // TODO: not sure if this is correct or not
    if (thing_seen.has(thing))
      return rival_seen.has(rival);
    if (rival_seen.has(rival))
      return thing_seen.has(thing);

    // Add object to cache
    thing_seen.add(thing);
    rival_seen.add(rival);

    // Return early on easy case
    if (thing === rival)
      return true;

    const thing_prototype = Object.getPrototypeOf(thing);
    const rival_prototype = Object.getPrototypeOf(rival);

    if (thing_prototype !== rival_prototype)
      return false;
    const prototype = thing_prototype;

    if (testers.has(prototype))
      return testers.get(prototype)(thing, rival, equals);
    else  // custom type
      return props_eq(thing, rival, equals);

  }

}

