require('dotenv').config();
const database=require("mongoose");

database.connect(process.env.MONGODB_URL);

const workerschema=new database.Schema({
  firstname:{
    type:String,
    required:true,
  },
  middlename:{
    type:String,
    required:true,
  },
  lastname:{
    type:String,
    required:true,
  },
  age:{
   type:Number,
   required:true,
  },
  createdby:{
    type:database.Schema.Types.ObjectId,
    ref:'Contractor',
    required:true,
    
  },
  workingfield:{
    type:[],
    required:true
  },
  joiningdate:{
    type:Date,
    default: Date.now()
  },
  allocated_to:{
   type:String,
   default:"null"
  },
  working_status:{
    type:String,
    default:"unallocated"
  },
  work_startingdate:{
    type:Date,
    default:null
  },
  work_endingdate:{
    type:Date,
    default:null
  }
})

module.exports=database.model("Worker",workerschema);