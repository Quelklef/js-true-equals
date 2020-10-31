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
const areTrulyEqual = equals(oneObject, anotherObject)
```

## Overview

The equality algorithm is pretty smart and is aware of:
- Native JS types! This includes primitives, `Array`, `Set`, `Map`, boxed primitives, typed arrays, etc.
- Prototypes!
- Getters and setters! A getter is not considered equal to a computed value.
- Custom properties on native types! For instance: `const ar = []; ar.my = 'prop'; console.assert(!equals(ar, []))`.
- (Non-)enumerability, (non-)configurability, and/or (non-)writability of object properties! These will be respected.
- etc.

## Details

- Basically works how you would expect
- However, the following may be of note:
- `equals(NaN, NaN) === true`
- `equals(+0, -0) === true`
- Prototypes are compared by identity, not structure
  - `equals(Object.create({}), Object.create({})) === false`
- For `Proxy` objects, all traps are ignored besides the following:
  - `getPrototypeOf`: objects are considered unequal if they have different prototypes
  - `ownKeys`: objects are considered unequal if they have different ownKeys (ignoring order)
  - `getOwnPropertyDescriptor`: objects are considered unequal if their descriptors differ for any property
    - The result of `getOwnPropertyDescriptor` on keys not in `ownKeys` is ignored
- Objects of type **`Function`, `Promise`, `WeakSet`,** or **`WeakMap`** will be compared via identity (`===`) due to JS limitations
