require('dotenv').config();
const database=require("mongoose");

database.connect(process.env.MONGODB_URL);

const contractorschema=new database.Schema({
  username:{
    type:String,
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
    type:String
  },
  entereddate:{
    type:Date,
    default: Date.now()
  }
});

module.exports=database.model("Contractor",contractorschema);