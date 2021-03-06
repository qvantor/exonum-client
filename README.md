# Light Client for Exonum Blockchain

[![Build status][travis-image]][travis-url]
[![npm version][npmjs-image]][npmjs-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![js-standard-style][codestyle-image]][codestyle-url]

[travis-image]: https://img.shields.io/travis/exonum/exonum-client/master.svg
[travis-url]: https://travis-ci.org/exonum/exonum-client
[npmjs-image]: https://img.shields.io/npm/v/exonum-client.svg
[npmjs-url]: https://www.npmjs.com/package/exonum-client
[coveralls-image]: https://coveralls.io/repos/github/exonum/exonum-client/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/exonum/exonum-client?branch=master
[codestyle-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[codestyle-url]: http://standardjs.com 

*Compatible with Exonum [v0.5](https://github.com/exonum/exonum/releases/tag/v0.5).*

A JavaScript library to work with Exonum blockchain from browser and Node.js.
Used to sign transactions before sending to blockchain and verify blockchain responses using cryptographic proofs.
Contains numerous helper functions.

*Find out more information about the [architecture and tasks][docs:clients] of light clients in Exonum.*

* [Getting started](#getting-started)
* [Data types](#data-types)
  * [Define data type](#define-data-type)
  * [Built-in types](#built-in-types)
  * [Nested data types](#nested-data-types)
  * [Arrays](#arrays)
* [Serialization](#serialization)
* [Hash](#hash)
* [Signature](#signature)
  * [Sign data](#sign-data)
  * [Verify signature](#verify-signature)
* [Transactions](#transactions)
* [Cryptographic proofs](#cryptographic-proofs)
  * [Merkle tree](#merkle-tree)
  * [Merkle Patricia tree](#merkle-patricia-tree)
* [Integrity checks](#integrity-checks)
  * [Verify block](#verify-block)
  * [An example of checking the existence of data](#an-example-of-checking-the-existence-of-data)
* [Helpers](#helpers)
  * [Generate key pair](#generate-key-pair)
  * [Get random number](#get-random-number)
  * [Converters](#converters)
    * [Hexadecimal to Uint8Array](#hexadecimal-to-uint8array)
    * [Hexadecimal to String](#hexadecimal-to-string)
    * [Uint8Array to Hexadecimal](#uint8array-to-hexadecimal)
    * [Binary String to Uint8Array](#binary-string-to-uint8array)
    * [Binary String to Hexadecimal](#binary-string-to-hexadecimal)
    * [String to Uint8Array](#string-to-uint8array)
* [Contributing](#contributing)
  * [Coding standards](#coding-standards)
  * [Test coverage](#test-coverage)
* [License](#license)

## Getting started

There are several options to include light client library in the application:

The most preferred way is to install Exonum Client as a [package][npmjs] from npm registry:

```sh
npm install exonum-client
```

Otherwise you can download the source code from GitHub and compile it before use in browser.

Include in browser:

```html
<script src="node_modules/exonum-client/dist/exonum-client.min.js"></script>
```

Usage in Node.js:

```javascript
let Exonum = require('exonum-client')
```

## Data types

The definition of data structures is the main part of each application based on Exonum blockchain.

On the one hand, each transaction must be [signed](#sign-data) before sending into blockchain.
Before the transaction is signed it is converted into byte array under the hood.

On the other hand, the data received from the blockchain should be converted into byte array under the hood
before it will be possible to [verify proof of its existence](#cryptographic-proofs) using cryptographic algorithm.

Converting data into a byte array is called [serialization](#serialization).
To get the same serialization result on the client and on the [service][docs:architecture:services] side,
there must be a strict serialization rules. This rules are formed by the data structure definition.

### Define data type

```javascript
let type = Exonum.newType({
  size: 12,
  fields: {
    balance: {type: Exonum.Uint32, size: 4, from: 0, to: 4},
    name: {type: Exonum.String, size: 8, from: 4, to: 12}
  }
})
```

**Exonum.newType** function requires a single argument of `Object` type with next structure:

| Property | Description | Type |
|---|---|---|
| **size** | The total length in bytes. | `Number` |
| **fields** | List of fields. | `Object` |

Field structure:

| Field | Description | Type |
|---|---|---|
| **type** | Definition of the field type. | [Built-in type](#built-in-types), [array](#arrays) or [custom data type](#nested-data-types) defined by the developer. | 
| **size** | Total length of the field in bytes. | `Number` |
| **from** | The beginning of the field segment in the byte array. | `Number` |
| **to** | The end of the field segment in the byte array. | `Number` |

### Built-in types

There are several primitive types are built it into the library.
These types must be used when constructing custom data types.

| Name | Size | Description | Type |
|---|---|---|---|
| **Int8** | 1 | Number in a range from `-128` to `127`. | `Number` |
| **Int16** | 2 | Number in a range from `-32768` to `32767`. | `Number` |
| **Int32** | 4 | Number in a range from `-2147483648` to `2147483647`. | `Number` |
| **Int64** | 8 | Number in a range from `-9223372036854775808` to `9223372036854775807`. | `Number` or `String`\* |
| **Uint8** | 1 | Number in a range from `0` to `255`. | `Number` |
| **Uint16** | 2 | Number in a range from `0` to `65535`. | `Number` |
| **Uint32** | 4 | Number in a range from `0` to `4294967295`. | `Number` |
| **Uint64** | 8 | Number in a range from `0` to `18446744073709551615`. | `Number` or `String`\* |
| **String** | 8\*\* | A string of variable length consisting of UTF-8 characters. | `String` |
| **Hash** | 32 | Hexadecimal string. | `String` |
| **PublicKey** | 32 | Hexadecimal string. | `String` |
| **Digest** | 64 | Hexadecimal string. | `String` |
| **Bool** | 1 | Value of boolean type. | `Boolean` |

*\*JavaScript limits minimum and maximum integer number.
Minimum safe integer in JavaScript is `-(2^53-1)` which is equal to `-9007199254740991`.
Maximum safe integer in JavaScript is `2^53-1` which is equal to `9007199254740991`.
For unsafe numbers out of the safe range use `String` only.
To determine either number is safe use built-in JavaScript function
[Number.isSafeInteger()][is-safe-integer].*

*\*\*Size of 8 bytes is due to the specifics of string [serialization][docs:architecture:serialization:segment-pointers]
using segment pointers.
Actual string length is limited only by the general message size limits which is depends on OS, browser and
hardware configuration.*

### Nested data types

Custom data type defined by the developer can be a field of other custom data type.

A nested type, regardless of its real size, always takes **8 bytes** in the parent type due to the specifics of its
[serialization][docs:architecture:serialization:segment-pointers] using segment pointers.

An example of a nested type:

```javascript
// Define a nested data type
let date = Exonum.newType({
  size: 4,
  fields: {
    day: {type: Exonum.Uint8, size: 1, from: 0, to: 1},
    month: {type: Exonum.Uint8, size: 1, from: 1, to: 2},
    year: {type: Exonum.Uint16, size: 2, from: 2, to: 4}
  }
})

// Define a data type
let payment = Exonum.newType({
  size: 16,
  fields: {
    date: {type: date, size: 8, from: 0, to: 8},
    amount: {type: Exonum.Uint64, size: 8, from: 8, to: 16}
  }
})
```

There is no limitation on the depth of nested data types.

### Arrays

The array in the light client library corresponds to the [vector structure][vector-structure]
in the Rust language.

**Exonum.newArray** function requires a single argument of `Object` type with next structure:

| Property | Description | Type |
|---|---|---|
| **size** | Length of the nested field type. | `Number` |
| **type** | Definition of the field type. | [Built-in type](#built-in-types), array or [custom data type](#nested-data-types) defined by the developer. |

An array, regardless of its real size, always takes **8 bytes** in the parent type due to the specifics of its
[serialization][docs:architecture:serialization:segment-pointers] using segment pointers.

An example of an array type field: 

```javascript
// Define an array
let year = Exonum.newArray({
  size: 2,
  type: Exonum.Uint16
})

// Define a data type
let type = Exonum.newType({
  size: 8,
  fields: {
    years: {type: year, size: 8, from: 0, to: 8}
  }
})
```

An example of an array nested in an array:

```javascript
// Define an array
let distance = Exonum.newArray({
  size: 4,
  type: Exonum.Uint32
})

// Define an array with child elements of an array type
let distances = Exonum.newArray({
  size: 8,
  type: distance
})

// Define a data type
let type = Exonum.newType({
  size: 8,
  fields: {
    measurements: {type: distances, size: 8, from: 0, to: 8}
  }
})
```

## Serialization

Each serializable data type has its (de)serialization rules, which govern how the instances of this type are
(de)serialized from/to a binary buffer.
Check [serialization guide][docs:architecture:serialization] for details.

Signature of `serialize` function:

```javascript
type.serialize(data, cutSignature)
```

| Argument | Description | Type |
|---|---|---|
| **data** | Data to serialize. | `Object` |
| **type** | Definition of the field type. | [Custom data type](#define-data-type) or [transaction](#define-transaction). |
| **cutSignature** | This flag is relevant only for **transaction** type. Specifies whether to not include a signature into the resulting byte array. *Optional.* | `Boolean` |

An example of serialization into a byte array:

```javascript
// Define a data type
let user = Exonum.newType({
  size: 21,
  fields: {
    firstName: {type: Exonum.String, size: 8, from: 0, to: 8},
    lastName: {type: Exonum.String, size: 8, from: 8, to: 16},
    age: {type: Exonum.Uint8, size: 1, from: 16, to: 17},
    balance: {type: Exonum.Uint32, size: 4, from: 17, to: 21}
  }
})

// Data to be serialized
const data = {
  firstName: 'John',
  lastName: 'Doe',
  age: 28,
  balance: 2500
}


// Serialize
let buffer = user.serialize(data) // [21, 0, 0, 0, 4, 0, 0, 0, 25, 0, 0, 0, 3, 0, 0, 0, 28, 196, 9, 0, 0, 74, 111, 104, 110, 68, 111, 101]
```

The value of the `buffer` array:

![Serialization example](img/serialization.png)

## Hash

Exonum uses [cryptographic hashes][docs:glossary:hash] of certain data for [transactions](#transactions) and
[proofs](#cryptographic-proofs).

Different signatures of the `hash` function are possible:

```javascript
Exonum.hash(data, type)
```

```javascript
type.hash(data)
```

| Argument | Description | Type |
|---|---|---|
| **data** | Data to be processed using a hash function. | `Object` |
| **type** | Definition of the data type. | [Custom data type](#define-data-type) or [transaction](#define-transaction). |

An example of hash calculation:

```javascript
// Define a data type
let user = Exonum.newType({
  size: 21,
  fields: {
    firstName: {type: Exonum.String, size: 8, from: 0, to: 8},
    lastName: {type: Exonum.String, size: 8, from: 8, to: 16},
    age: {type: Exonum.Uint8, size: 1, from: 16, to: 17},
    balance: {type: Exonum.Uint32, size: 4, from: 17, to: 21}
  }
})

// Data that has been hashed
const data = {
  firstName: 'John',
  lastName: 'Doe',
  age: 28,
  balance: 2500
}

// Get a hash
let hash = user.hash(data) // 1e53d91704b4b6adcbea13d2f57f41cfbdee8f47225e99bb1ff25d85474185af
```

It is also possible to get a hash from byte array:

```javascript
Exonum.hash(buffer)
```

| Argument | Description | Type |
|---|---|---|
| **buffer** | Byte array. | `Array` or `Uint8Array`. |

An example of byte array hash calculation:

```javascript
const arr = [132, 0, 0, 5, 89, 64, 0, 7]

let hash = Exonum.hash(arr) // 9518aeb60d386ae4b4ecc64e1a464affc052e4c3950c58e32478c0caa9e414db
```

## Signature

The procedure for [**signing data**](#sign-data) using signing key pair
and [**verifying of obtained signature**](#verify-signature) is commonly used
in the process of data exchange between the client and the service.  

*Built-in [**Exonum.keyPair**](#generate-key-pair) helper function can be used
to generate a new random signing key pair.*

### Sign data

The signature can be obtained using the **secret key** of the signing pair.

There are three possible signatures of the `sign` function:

```javascript
Exonum.sign(secretKey, data, type)
```

```javascript
type.sign(secretKey, data)
```

```javascript
Exonum.sign(secretKey, buffer)
```

| Argument | Description | Type |
|---|---|---|
| **secretKey** | Secret key as hexadecimal string. | `String` |
| **data** | Data to be signed. | `Object` |
| **type** | Definition of the data type. | [Custom data type](#define-data-type) or [transaction](#define-transaction). |
| **buffer** | Byte array. | `Array` or `Uint8Array`. |

The `sign` function returns value as hexadecimal `String`.

An example of data signing:

```javascript
// Define a data type
let user = Exonum.newType({
  size: 21,
  fields: {
    firstName: {type: Exonum.String, size: 8, from: 0, to: 8},
    lastName: {type: Exonum.String, size: 8, from: 8, to: 16},
    age: {type: Exonum.Uint8, size: 1, from: 16, to: 17},
    balance: {type: Exonum.Uint32, size: 4, from: 17, to: 21}
  }
})

// Data to be signed
const data = {
  firstName: 'John',
  lastName: 'Doe',
  age: 28,
  balance: 2500
}

// Define the signing key pair 
const publicKey = 'fa7f9ee43aff70c879f80fa7fd15955c18b98c72310b09e7818310325050cf7a'
const secretKey = '978e3321bd6331d56e5f4c2bdb95bf471e95a77a6839e68d4241e7b0932ebe2b' +
 'fa7f9ee43aff70c879f80fa7fd15955c18b98c72310b09e7818310325050cf7a'

// Sign the data
let signature = Exonum.sign(secretKey, data, user) // '41884c5270631510357bb37e6bcbc8da61603b4bdb05a2c70fc11d6624792e07c99321f8cffac02bbf028398a4118801a2cf1750f5de84cc654f7bf0df71ec00'
```

### Verify signature

The signature can be verified using the **author's public key**.

There are two possible signatures of the `verifySignature` function:

```javascript
Exonum.verifySignature(signature, publicKey, data, type)
```

```javascript
type.verifySignature(signature, publicKey, data)
```

| Argument | Description | Type |
|---|---|---|
| **signature** | Signature as hexadecimal string. | `String` |
| **publicKey** | Public key as hexadecimal string. | `String` |
| **data** | Data that has been signed. | `Object` |
| **type** | Definition of the data type. | [Custom data type](#define-data-type) or [transaction](#define-transaction). |

The `verifySignature` function returns value of `Boolean` type.

An example of signature verification:

```javascript
// Define a data type
let user = Exonum.newType({
  size: 21,
  fields: {
    firstName: {type: Exonum.String, size: 8, from: 0, to: 8},
    lastName: {type: Exonum.String, size: 8, from: 8, to: 16},
    age: {type: Exonum.Uint8, size: 1, from: 16, to: 17},
    balance: {type: Exonum.Uint32, size: 4, from: 17, to: 21}
  }
})

// Data that has been signed
const data = {
  firstName: 'John',
  lastName: 'Doe',
  age: 28,
  balance: 2500
}

// Define a signing key pair 
const publicKey = 'fa7f9ee43aff70c879f80fa7fd15955c18b98c72310b09e7818310325050cf7a'
const secretKey = '978e3321bd6331d56e5f4c2bdb95bf471e95a77a6839e68d4241e7b0932ebe2b' +
 'fa7f9ee43aff70c879f80fa7fd15955c18b98c72310b09e7818310325050cf7a'

// Signature obtained upon signing using secret key
const signature = '41884c5270631510357bb37e6bcbc8da61603b4bdb05a2c70fc11d6624792e07' +
 'c99321f8cffac02bbf028398a4118801a2cf1750f5de84cc654f7bf0df71ec00'

// Verify the signature
let result = Exonum.verifySignature(signature, publicKey, data, user) // true
```

## Transactions

Transaction in Exonum is a operation to change the data stored in blockchain.
Transaction processing rules is a part of business logic implemented on [service][docs:architecture:services] side.

When creating a transaction on the client side, all the fields of transaction are first described using
[custom data types](#define-data-type).
Then [signed](#sign-data) using signing key pair.
And finally can be sent to the service.
 
Read more about [transactions][docs:architecture:transactions] in Exonum.

An example of a transaction definition:

```javascript
let sendFunds = Exonum.newMessage({
  network_id: 0,
  protocol_version: 0,
  service_id: 130,
  message_id: 128,
  size: 72,
  fields: {
    from: {type: Exonum.Hash, size: 32, from: 0, to: 32},
    to: {type: Exonum.Hash, size: 32, from: 32, to: 64},
    amount: {type: Exonum.Uint64, size: 8, from: 64, to: 72}
  }
})
```

**Exonum.newMessage** function requires a single argument of `Object` type with next structure:

| Property | Description | Type |
|---|---|---|
| **network_id** | [Network ID][docs:architecture:serialization:network-id]. | `Number` |
| **protocol_version** | [Protocol version][docs:architecture:serialization:protocol-version]. | `Number` |
| **service_id** | [Service ID][docs:architecture:serialization:service-id]. | `Number` |
| **message_id** | [Message ID][docs:architecture:serialization:message-id]. | `Number` |
| **signature** | Signature as hexadecimal string. *Optional.* | `String` |
| **size** | The total length in bytes. | `Number` |
| **fields** | List of fields. | `Object` |

Field structure is identical to field structure of [custom data type](#define-data-type).

Examples of operations on transactions:

* [Define transaction](examples/transaction.md#define-transaction)
* [Serialize transaction](examples/transaction.md#serialize-transaction)
* [Sign transaction](examples/transaction.md#sign-transaction)
* [Verify signed transaction](examples/transaction.md#verify-signed-transaction)
* [Get a transaction hash](examples/transaction.md#get-a-transaction-hash)

## Cryptographic proofs

A cryptographic proof is a format in which a Exonum node can provide sensitive data from a blockchain.
These proofs are based on [Merkle trees][docs:glossary:merkle-tree] and their variants.

Light client library validates the cryptographic proof and can prove the integrity and reliability of the received data.

Read more about design of [cryptographic proofs][docs:advanced:merkelized-list] in Exonum.

### Merkle tree

```javascript
let elements = Exonum.merkleProof(rootHash, count, tree, range, type)
```

The `merkleProof` method is used to validate the Merkle tree and extract a **list of data elements**.

| Argument | Description | Type |
|---|---|---|
| **rootHash** | The root hash of the Merkle tree as hexadecimal string. | `String` |
| **count** | The total number of elements in the Merkle tree. | `Number` |
| **proofNode** | The Merkle tree. | `Object` |
| **range** | An array of two elements of `Number` type. Represents list of obtained elements: `[startIndex; endIndex)`. | `Array` |
| **type** | Definition of the elements type. *Optional. The `merkleProof` method expects to find byte arrays as values in the tree if `type` is not passed.* | [Custom data type](#define-data-type) |

An [example of verifying a Merkle tree](examples/merkle-tree.md).

### Merkle Patricia tree

```javascript
let data = Exonum.merklePatriciaProof(rootHash, proofNode, key, type)
```

The `merklePatriciaProof` method is used to validate the Merkle Patricia tree and extract a **data**.

Returns `null` if the tree is valid but data is not found.

| Argument | Description | Type |
|---|---|---|
| **rootHash** | The root hash of the Merkle Patricia tree as hexadecimal string. | `String` |
| **proofNode** | The Merkle Patricia tree. | `Object` |
| **key** | Searched data key as hexadecimal string. | `String` |
| **type** | Definition of the data type. *Optional. The `merklePatriciaProof` method expects to find byte array as value in the tree if `type` is not passed.* | [Custom data type](#define-data-type) |

An [example of verifying a Merkle Patricia tree](examples/merkle-patricia-tree.md).

## Integrity checks

### Verify block

```javascript
Exonum.verifyBlock(data, validators, networkId)
```

Each new block in Exonum blockchain is signed by [validators][docs:glossary:validator].
To prove the integrity and reliability of the block, it is necessary to verify their signatures.
The signature of each validator are stored in the precommits.

The `merkleProof` method is used to validate block and its precommits.

Returns `true` if verification is succeeded or `false` if it is failed.

| Argument | Description | Type |
|---|---|---|
| **data** | Structure with block and precommits. | `Object` |
| **validators** | An array of validators public keys as a hexadecimal strings. | `Array` |
| **networkId** | This field will be used to send inter-blockchain messages in future releases. For now, it is not used and must be equal to `0`. | `Number` |

An example of [block verification](examples/block.md).

### An example of checking the existence of data

In a real-world application, it is recommended to verify the entire path from the data
to the block in which this data is written.
Only such a verification can guarantee the integrity and reliability of the data.

An example of [checking the existence of data](examples/check-existence.md).

## Helpers

### Generate key pair

```javascript
const pair = Exonum.keyPair()
```

```javascript
{
  publicKey: "...", // 32-byte public key
  secretKey: "..." // 64-byte secret key
}
```

**Exonum.keyPair** function generates a new random [Ed25519][docs:glossary:digital-signature] signing key pair using the
[TweetNaCl][tweetnacl:key-pair] cryptographic library.

### Get random number

```javascript
const rand = Exonum.randomUint64()
``` 

**Exonum.randomUint64** function generates a new random `Uint64` number of cryptographic quality using the
[TweetNaCl][tweetnacl:random-bytes] cryptographic library.

### Converters

#### Hexadecimal to Uint8Array

```javascript
const hex = '674718178bd97d3ac5953d0d8e5649ea373c4d98b3b61befd5699800eaa8513b'

Exonum.hexadecimalToUint8Array(hex) // [103, 71, 24, 23, 139, 217, 125, 58, 197, 149, 61, 13, 142, 86, 73, 234, 55, 60, 77, 152, 179, 182, 27, 239, 213, 105, 152, 0, 234, 168, 81, 59]
```

#### Hexadecimal to String

```javascript
const hex = '674718178bd97d3ac5953d0d8e5649ea373c4d98b3b61befd5699800eaa8513b'

Exonum.hexadecimalToBinaryString(hex) // '0110011101000111000110000001011110001011110110010111110100111010110001011001010100111101000011011000111001010110010010011110101000110111001111000100110110011000101100111011011000011011111011111101010101101001100110000000000011101010101010000101000100111011'
```

#### Uint8Array to Hexadecimal

```javascript
const arr = new Uint8Array([103, 71, 24, 23, 139, 217, 125, 58, 197, 149, 61, 13, 142, 86, 73, 234, 55, 60, 77, 152, 179, 182, 27, 239, 213, 105, 152, 0, 234, 168, 81, 59])

Exonum.uint8ArrayToHexadecimal(arr) // '674718178bd97d3ac5953d0d8e5649ea373c4d98b3b61befd5699800eaa8513b'
```

#### Binary String to Uint8Array

```javascript
const str = '0110011101000111000110000001011110001011110110010111110100111010110001011001010100111101000011011000111001010110010010011110101000110111001111000100110110011000101100111011011000011011111011111101010101101001100110000000000011101010101010000101000100111011'

Exonum.binaryStringToUint8Array(str) // [103, 71, 24, 23, 139, 217, 125, 58, 197, 149, 61, 13, 142, 86, 73, 234, 55, 60, 77, 152, 179, 182, 27, 239, 213, 105, 152, 0, 234, 168, 81, 59]
```

#### Binary String to Hexadecimal

```javascript
const str = '0110011101000111000110000001011110001011110110010111110100111010110001011001010100111101000011011000111001010110010010011110101000110111001111000100110110011000101100111011011000011011111011111101010101101001100110000000000011101010101010000101000100111011'

Exonum.binaryStringToHexadecimal(str) // '674718178bd97d3ac5953d0d8e5649ea373c4d98b3b61befd5699800eaa8513b'
```

#### String to Uint8Array

```javascript
const str = 'Hello world'

Exonum.stringToUint8Array(str) // [72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
```

## Contributing

The contributing to the Exonum Client is based on the same principles and rules as
[the contributing to exonum-core][contributing].

### Coding standards

The coding standards are described in the [`.eslintrc`](.eslintrc.json) file.

To help developers define and maintain consistent coding styles between different editors and IDEs
we used [`.editorconfig`](.editorconfig) configuration file.

### Test coverage

All functions must include relevant unit tests.
This applies to both of adding new features and fixing existed bugs.

## License

Exonum Client is licensed under the Apache License (Version 2.0). See [LICENSE](LICENSE) for details.

[docs:clients]: https://exonum.com/doc/architecture/clients
[docs:architecture:services]: https://exonum.com/doc/architecture/services
[docs:architecture:serialization]: https://exonum.com/doc/architecture/serialization
[docs:architecture:serialization:segment-pointers]: https://exonum.com/doc/architecture/serialization/#segment-pointers
[docs:architecture:serialization:network-id]: https://exonum.com/doc/architecture/serialization/#etwork-id
[docs:architecture:serialization:protocol-version]: https://exonum.com/doc/architecture/serialization/#protocol-version
[docs:architecture:serialization:service-id]: https://exonum.com/doc/architecture/serialization/#service-id
[docs:architecture:serialization:message-id]: https://exonum.com/doc/architecture/serialization/#message-id
[docs:architecture:transactions]: https://exonum.com/doc/architecture/transactions
[docs:advanced:merkelized-list]: https://exonum.com/doc/advanced/merkelized-list
[docs:glossary:digital-signature]: https://exonum.com/doc/glossary/#digital-signature
[docs:glossary:hash]: https://exonum.com/doc/glossary/#hash
[docs:glossary:blockchain-state]: https://exonum.com/doc/glossary/#blockchain-state
[docs:glossary:merkle-tree]: https://exonum.com/doc/glossary/#merkle-tree
[docs:glossary:validator]: https://exonum.com/doc/glossary/#validator
[npmjs]: https://www.npmjs.com/package/exonum-client
[gitter]: https://gitter.im/exonum/exonum
[twitter]: https://twitter.com/ExonumPlatform
[newsletter]: https://exonum.com/#newsletter
[contributing]: https://exonum.com/doc/contributing/
[is-safe-integer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger
[vector-structure]: https://doc.rust-lang.org/std/vec/struct.Vec.html
[tweetnacl:key-pair]: https://github.com/dchest/tweetnacl-js#naclsignkeypair
[tweetnacl:random-bytes]: https://github.com/dchest/tweetnacl-js#random-bytes-generation
