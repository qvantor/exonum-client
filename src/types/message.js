import { Uint8, Uint16 } from './primitive'
import { Digest, PublicKey } from './hexadecimal'
import { fieldIsFixed, newType } from './generic'
import * as serialization from './serialization'
import * as crypto from '../crypto'
import { send } from '../blockchain/transport'
import * as Protobuf from 'protobufjs/light'

const Root = Protobuf.Root
const Type = Protobuf.Type
const Field = Protobuf.Field

let root = new Root()

export const SIGNATURE_LENGTH = 64
const TRANSACTION_CLASS = 0
const TRANSACTION_TYPE = 0
const PRECOMMIT_CLASS = 1
const PRECOMMIT_TYPE = 0

class Message {
  constructor (type) {
    this.schema = type.fields
    this.author = type.author
    this.cls = type.cls
    this.type = type.type
  }

  size () {
    return this.fields.reduce((accumulator, field) => {
      if (fieldIsFixed(field)) {
        return accumulator + field.type.size()
      }
      return accumulator + serialization.POINTER_SIZE
    }, 0)
  }
}

/**
 * @constructor
 * @param {Object} type
 */
class Transaction extends Message {
  constructor (type) {
    super(type)

    this.cls = TRANSACTION_CLASS
    this.type = TRANSACTION_TYPE
    this.service_id = type.service_id
    this.message_id = type.message_id
    this.signature = type.signature
  }

  /**
   * Serialization header
   * @returns {Array}
   */
  createHeader () {
    let buffer = []
    PublicKey.serialize(this.author, buffer, buffer.length)
    Uint8.serialize(this.cls, buffer, buffer.length)
    Uint8.serialize(this.type, buffer, buffer.length)
    Uint16.serialize(this.service_id, buffer, buffer.length)
    Uint16.serialize(this.message_id, buffer, buffer.length)
    return buffer
  }

  /**
   * Serialize into array of 8-bit integers
   * @param {Object} data
   * @returns {Array}
   */
  serialize (data) {
    const buffer = this.createHeader()
    const body = this.schema.encode(data).finish()

    if (this.signature) {
      Digest.serialize(this.signature, body, body.length)
    }

    body.forEach(element => {
      buffer.push(element)
    })

    return buffer
  }

  /**
   * Get SHA256 hash
   * @param {Object} data
   * @returns {string}
   */
  hash (data) {
    return crypto.hash(data, this)
  }

  /**
   * Get ED25519 signature
   * @param {string} secretKey
   * @param {Object} data
   * @returns {string}
   */
  sign (secretKey, data) {
    return crypto.sign(secretKey, data, this)
  }

  /**
   * Verifies ED25519 signature
   * @param {string} signature
   * @param {string} publicKey
   * @param {Object} data
   * @returns {boolean}
   */
  verifySignature (signature, publicKey, data) {
    return crypto.verifySignature(signature, publicKey, data, this)
  }

  /**
   * Send transaction to the blockchain
   * @param {string} explorerBasePath
   * @param {Object} data
   * @param {string} secretKey
   * @param {number} attempts
   * @param {number} timeout
   * @returns {Promise}
   */
  send (explorerBasePath, data, secretKey, attempts, timeout) {
    return send(explorerBasePath, this, data, secretKey, attempts, timeout)
  }
}

/**
 * Create element of Transaction class
 * @param {Object} type
 * @returns {Transaction}
 */
export function newTransaction (type) {
  return new Transaction(type)
}

/**
 * Check if passed object is of type Transaction
 * @param type
 * @returns {boolean}
 */
export function isTransaction (type) {
  return type instanceof Transaction
}

/**
 * @constructor
 * @param {Object} type
 */
class Precommit extends Message {
  constructor (type) {
    super(type)

    this.cls = PRECOMMIT_CLASS
    this.type = PRECOMMIT_TYPE
  }

  /**
   * Serialization header
   * @returns {Array}
   */
  createHeader () {
    let buffer = []
    PublicKey.serialize(this.author, buffer, buffer.length)
    Uint8.serialize(this.cls, buffer, buffer.length)
    Uint8.serialize(this.type, buffer, buffer.length)
    return buffer
  }

  /**
   * Serialize data into array of 8-bit integers
   * @param {Object} data
   * @returns {Array}
   */
  serialize (data) {
    const buffer = this.createHeader()
    const body = this.schema.encode(data).finish()

    body.forEach(element => {
      buffer.push(element)
    })

    return buffer
  }
}

/**
 * Create element of Precommit class
 * @param {Object} type
 * @returns {Precommit}
 */
export function newPrecommit (type) {
  return new Precommit(type)
}
