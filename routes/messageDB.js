require('dotenv').config();
const database=require("mongoose");

database.connect(process.env.MONGODB_URL);

const messageschema=new database.Schema({
    contractor_username:{
        type:String,
        default:null
    },
    company_username:{
            type:String,
            default:null
          },
          message:{
            type:String,
            default:"no messages"
          },
          worker_field:{
            type:String,
            default:null
          },
          numberofworkers:{
            type:Number,
            default:null
          },
          noofdays:{
            type:Number,
            default:null
          },
          message_status:{
            type:String,
            default:'pending'
          }
        
});

module.exports=database.model("Message",messageschema);
