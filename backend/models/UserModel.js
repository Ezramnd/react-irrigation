import {Sequelize} from "sequelize"; 
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const Users = db.define('users' ,{
        name:{
        type: DataTypes.STRING
        },
        email:{
        type: DataTypes.STRING
        },
        password:{
        type: DataTypes.STRING
        },
        refresh_token:{
        type: DataTypes.TEXT
        },
        role: {
        type: DataTypes.ENUM('user', 'admin'), 
        defaultValue: "user",
        allowNull: false
        },
      resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
      },
      resetPasswordExpires: {
            type: DataTypes.DATE,
            allowNull: true
      }

},{
      freezeTableName:true
});

export default Users;