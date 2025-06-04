require('dotenv').config();
const database=require("mongoose");

database.connect(process.env.MONGODB_URL);

const companyschema=new database.Schema({
  username:{
    type:Number,
    required:true,
    unique:true,
  },
  password:{
    type:String,
    required:true
  },
  domain:{
    type:String,
    required:true
  },
  token:{
    type:String,
    required:true
  },
  entereddate:{
    type:Date,
    default: Date.now()
  }
})

module.exports=database.model("Company",companyschema);