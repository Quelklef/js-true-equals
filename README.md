# js-true-equals

The goal of this package is to get as close as possible to a perfect JS equality algorithm..

## Usage

```js
npm i true-equals
```

then

```js
const { equals } = require('true-equals');
// later ...
const are_equal = equals(one_object, another_object)
```

## Behaviour

The equality algorithm is pretty smart and is aware of:
- Native JS types! This includes primitives, `Array`, `Set`, `Map`, boxed primitives, typed arrays, etc.
- Prototypes!
- Getters and setters! A getter is not considered equal to a computed value.
- Custom properties on native types! For instance: `const ar = []; ar.my = 'prop'; console.assert(!equals(ar, []))`.
- (Non-)enumerability, (non-)configurability, and/or (non-)writability of object properties! These will be respected.
- etc.

Additionally, custom eqaulity algorithms are supported if needed; see the *Custom equality algorithms* section.

Possibly surprising rules:
- `equals(NaN, NaN) === true`
- `equals(+0, -0) === true`

## Versioning

The *official* API for this package is to provide an equality algorithm with perfect behaviour.
All imperfect behaviour, even if documented, is *not* a part of the API and should *not* be relied on.
Updates to this package will thus almost always be either minor- or patch-level updates.

## Caveats

Where *caveat* means incorrect behaviour due to JS limitations.

- **`Function`, `Promise`, `WeakSet`, `WeakMap`**: Object of these types will be compared via identity (`===`)

- **`Proxy`**: TODO: investigate

## Custom equality algorithms

If this package is breaking on particular values, you may patch in a custom cloning function for any object or type.
Import the `customEquals` symbol, then assign the `[customEquals]` property of your object or prototype to the custom cloning function.

```js
const { equals, customEquals } = require('true-equals');

// give a custom equality algorithm to an object
const object = {
  [customEquals](other) {
    return other === 'we are equal';
  }
};
console.assert(equals(object, 'we are equal'));
// A custom algorithm will be respected on either argument
console.assert(equals('we are equal', object));

// give a custom equality algorithm to a type
class Type {
  [customClone](other) {
    return 'prototypes too!!';
  }
}
const instance = new Type();
console.assert(equals(instance, 'prototypes too!!'));

// if both objects have a custom algorithm, the first argument will take precedence:
const always_equal = { [customEquals](other) { return true; } };
const never_equal  = { [customEquals](other) { return false; } };
console.assert(equals(always_equal, never_equal) === true);
console.assert(equals(never_equal, always_equal) === false);
```

This package also exports `custom_equals`, which is an alias for `customEquals`.
