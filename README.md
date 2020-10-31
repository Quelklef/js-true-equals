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

## Overview

The equality algorithm is pretty smart and is aware of:
- Native JS types! This includes primitives, `Array`, `Set`, `Map`, boxed primitives, typed arrays, etc.
- Prototypes!
- Getters and setters! A getter is not considered equal to a computed value.
- Custom properties on native types! For instance: `const ar = []; ar.my = 'prop'; console.assert(!equals(ar, []))`.
- (Non-)enumerability, (non-)configurability, and/or (non-)writability of object properties! These will be respected.
- etc.

## Versioning

The *official* API for this package is to provide an equality algorithm with perfect behaviour.
All imperfect behaviour, even if documented, is *not* a part of the API and should *not* be relied on.
Updates to this package will thus almost always be either minor- or patch-level updates.

## Behaviour details

Mostly, `true-equals` acts how one would expect.

Perhaps-significant behaviour:

- `equals(NaN, NaN) === true`
- `equals(+0, -0) === true`
- Prototypes are compared by identity, not structure
  - `equals(Object.create({}), Object.create({})) === false`
- For `Proxy` objects, all traps are ignored besides `getPrototypeOf`, `ownKeys`, `getOwnPropertyDescriptor`, and `get`
  - `getPrototypeOf`: objects are considered unequal if they have different prototypes
  - `ownKeys`: objects are considered unequal if they have different ownKeys (ignoring order)
  - `getOwnPropertyDescriptor`: objects are considered unequal if their descriptors differ for any property
    - The behaviour of `getOwnPropertyDescriptor` on keys not in `ownKeys` is ignored

## Caveats

Where *caveat* means incorrect behaviour due to JS limitations.

- **`Function`, `Promise`, `WeakSet`, `WeakMap`**: Object of these types will be compared via identity (`===`)
