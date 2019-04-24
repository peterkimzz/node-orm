'use strict'

import { uuid } from '../utils/uuid'
import bcrypt from 'bcrypt'
import userCache from '../caches/users.cache'

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      uuid: {
        allowNull: false,
        unique: true,
        type: 'BINARY(16)',
        defaultValue: () => Buffer.from(uuid(), 'hex'),
        get: function() {
          return Buffer.from(this.getDataValue('uuid')).toString('hex')
        }
      },
      email: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
        validate: {
          isEmail: true
        }
      },
      password: {
        allowNull: false,
        type: DataTypes.STRING
      }
    },
    {
      tableName: 'users',
      timestamps: true
    }
  )

  // associations
  User.associate = function(models) {}

  // hooks
  User.beforeSave(async (user, options) => {
    if (user.changed('password')) {
      const salt = await bcrypt.genSalt(10)
      user.password = await bcrypt.hash(user.password, salt)
    }
  })

  User.afterSave((user, options) => userCache.store(user))

  // print
  User.prototype.toWeb = function() {
    const values = Object.assign({}, this.get())

    delete values.id
    delete values.password

    return values
  }

  return User
}
