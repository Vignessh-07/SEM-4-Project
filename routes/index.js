var express = require('express');
var router = express.Router();

var contractormodel = require("./contractorDB");
var companymodel = require("./companyDB");
var workermodel = require("./workerDB");
var messagemodel=require("./messageDB");

//for password hashing and protecting routes
var jwt = require('jsonwebtoken');
var secretkey = "BcdeFghijklmnopqrstuvwxyzABCDEfghijklmnopqr";
var bcrypt = require('bcryptjs');

async function hashpassword(password) {
  var result = await bcrypt.hash(password, 10);
  return result;
};

async function comparepassword(userpassword, hashedpassword) {
  var result = await bcrypt.compare(userpassword, hashedpassword);
  return result;
};

router.get('/', function (req, res, next) {
  res.render('register');
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/contractorprofile', isAuthenticated1, async (req, res) => {
  var searchresults=[];
  res.render('contractorprofile', { searchresults });
});

router.get('/createworker',isAuthenticated1,(req,res)=>{
  res.render('createworker');
});

router.get('/companyprofile', isAuthenticated2,async (req, res) => {

  var {username}=jwt.verify(req.cookies.Company,secretkey);

  var workerresults=[];
  workerresults=await workermodel.find(
    {
      working_status:"Allocated",
      allocated_to:username
}
).populate('createdby');
  res.render('companyprofile',{workerresults});
});


router.post('/register', async (req, res) => {

  try {
    //to check all the credentials are filled or not  
    if (!req.body.username || !req.body.password || !req.body.domain) {
      throw new Error("Username, password, and domain are required.");
    }

    //to check if there is already a user with same username
    var check1;
    var check2;
    if (req.body.domain === "contractor") {
      check1 = await contractormodel.findOne({ username: req.body.username });
    }
    else if (req.body.domain === "company") {
      check2 = await companymodel.findOne({ username: req.body.username })
    }
    if (check1) {
      throw new Error("username already exists in contractors,pls try different username.");
    }
    if (check2) {
      throw new Error("username already exists in company, pls try different username.");
    }
    
    if(req.body.password.length < 8){
      throw new Error("password should be of minimum 8 characters.");
    }

    if (req.body.domain === "contractor") {

      var contractordata = {
        username: req.body.username,
        password: await hashpassword(req.body.password),
        domain: req.body.domain
      };
      var contractor = await contractormodel.create(contractordata);

      var webtoken = jwt.sign({ username: req.body.username, domain: req.body.domain, contractorid: contractor._id }, secretkey);

      await contractormodel.updateOne({ _id: contractor._id }, { token: webtoken });

    }
    else if (req.body.domain === "company") {

      var webtoken = jwt.sign({ username: req.body.username, domain: req.body.domain }, secretkey);

      var companydata = {
        username: req.body.username,
        password: await hashpassword(req.body.password),
        domain: req.body.domain,
        token: webtoken
      };
      await companymodel.create(companydata);
    }
    res.redirect('/login');
  } catch (error) {
    res.render('register', { err: error.message })
    console.log(error.message);
  }
});

router.post('/login', async (req, res) => {
  try {
    //to check all the credentials are filled or not  
    if (!req.body.username || !req.body.password || !req.body.domain) {
      throw new Error("Username, password, and domain are required.");
    }

    //to check if the user exists and if exists then redirect to respective profile pages
    var scan1;
    var scan2;
    var scan3;
    var scan4;
    if (req.body.domain === "contractor") {
      scan1 = await contractormodel.findOne({ username: req.body.username });

      if (scan1) {
        scan3 = await comparepassword(req.body.password, scan1.password);
      }
      else if (!scan1) {
        throw new Error("wrong username of contractor");
      }

      if (scan3) {
        res.cookie('Contractor', scan1.token, { maxAge: 600000, httpOnly: true });

        res.redirect('/contractorprofile');
      }
      else if (!scan3) {
        throw new Error("wrong password");
      }
    }
    else if (req.body.domain === "company") {
      scan2 = await companymodel.findOne({ username: req.body.username });

      if (scan2) {
        scan4 = await comparepassword(req.body.password, scan2.password);
      }
      else if (!scan2) {
        throw new Error("wrong username of company");
      }

      if (scan4) {
        res.cookie('Company', scan2.token, { maxAge: 600000, httpOnly: true });

        res.redirect('/companyprofile');
      }
      else if (!scan4) {
        throw new Error("wrong password");
      }
    }


  }
  catch (error) {
    res.render('login', { err: error.message });
    console.log(error.message);
  }
});


function isAuthenticated1(req, res, next) {
  var contractorcookie = req.cookies.Contractor;
  if (contractorcookie) {
    console.log("contractor cookie found");
    try {
      console.log("contractor cookie founded is", contractorcookie);
      var verification = jwt.verify(contractorcookie, secretkey);
      console.log("contractor verification done", verification);
      if (verification) {
        console.log("contractor authenticated");
        return next();
      }
      else {
        throw new Error("You do not have access to this domain");
      }
    }
    catch (error) {
      console.error("Verification error:", error.message);
      res.clearCookie('Contractor');
      return res.redirect('/login');
    }
  }
  else {
    return res.redirect('/login');
  }
};

function isAuthenticated2(req, res, next) {
  var companycookie = req.cookies.Company;
  if (companycookie) {
    console.log("company cookie found");
    try {
      console.log("company cookie founded is", companycookie);
      var verification = jwt.verify(companycookie, secretkey);
      console.log("company verification done", verification);
      if (verification) {
        console.log("company authenticated");
        return next();
      }
      else {
        throw new Error("You do not have access to this domain");
      }
    }
    catch (error) {
      console.error("Verification error:", error.message);
      res.clearCookie('Company');
      return res.redirect('/login');
    }
  }
  else {
    return res.redirect('/login');
  }
};

router.post('/createworker', isAuthenticated1, async (req, res) => {
  try {
    var workingFields = req.body.workingfield.split(',').map(field => field.trim());

    var { contractorid } = jwt.verify(req.cookies.Contractor, secretkey);

    var workerdata = {
      firstname: req.body.firstname,
      middlename: req.body.middlename,
      lastname: req.body.lastname,
      createdby: contractorid,
      age: req.body.age,
      workingfield: workingFields
    };
    await workermodel.create(workerdata);
    res.redirect('/createworker');
  }
  catch (error) {
    console.log(error.message);
    res.redirect('/contractorprofile');
  }
});

router.post('/searchworker', isAuthenticated1, async (req, res) => {
  try {
    var search  = req.body.searchfield;
    var {contractorid}=jwt.verify(req.cookies.Contractor,secretkey)
    var searchresults= await workermodel.find({
       createdby:contractorid,
       workingfield:search
      });
    res.render('contractorprofile', { searchresults});
  }
  catch (error) {
    console.log(error.message);
    res.redirect('/contractorprofile');
  }
});

router.get('/viewworker', isAuthenticated1, async (req, res) => {
  try {
    var { contractorid } = jwt.verify(req.cookies.Contractor, secretkey);
    var viewresults = await workermodel.find({ createdby: contractorid });
    res.render('viewworker', { viewresults });
  }
  catch (error) {
    console.log(error.message);
    res.redirect('/contractorprofile');
  }
});


router.get('/allocateworker', isAuthenticated1, (req, res) => {
  res.render('allocateworker');
});

router.post('/allocate', isAuthenticated1, async (req, res) => {
  try {
    await workermodel.updateOne({
      _id: req.body.workerid
    },
      {
        allocated_to:req.body.allocatedto,
        working_status:"Allocated",
        work_startingdate: req.body.date1,
        work_endingdate: req.body.date2
      });
    console.log("updated");
    res.redirect('/allocateworker');
  } catch (error) {
    console.log(error.message);
    res.redirect('/contractorprofile');
  }
});

router.post('/deallocate', isAuthenticated1, async (req, res) => {
  try {
    await workermodel.updateOne({
      _id: req.body.workerid_deallocate
    },
      {
        allocated_to:"null",
        working_status: "unallocated",
        work_startingdate: null,
        work_endingdate: null
      }
    );
    console.log("after updated");
    res.redirect('/allocateworker');
  } catch (error) {
    console.log(error.message);
    res.redirect('/contractorprofile');
  }
});


router.get('/viewcontractor',isAuthenticated2, async (req,res)=>{
  try {
    var contractors=await contractormodel.find({domain:"contractor"});
    var contractors_usernames=contractors.map(e=>e.username);
    res.render('viewcontractor',{contractors_usernames});
  } 
  catch (error) {
    console.log(error.message);
    res.redirect('/companyprofile');
  }
});

router.get('/sendmessage',isAuthenticated2,(req,res)=>{
  res.render('sendmessage');
});

router.post('/sendmessage',isAuthenticated2,async (req,res)=>{
  try {
    var {username}=jwt.verify(req.cookies.Company,secretkey);
   var message =await messagemodel.create(
    {
      contractor_username:req.body.contractor_username,
      company_username:username,
      message:req.body.message,
      worker_field:req.body.field,
      numberofworkers:req.body.numberofworkers,
      noofdays:req.body.noofdays
    }
    );
    res.render('sendmessage');
  } 
  catch (error) {
    console.log(error.message);
    res.redirect('/companyprofile');
  }
});


router.get('/notification',isAuthenticated1,async (req,res)=>{
  try {
    var { username } = jwt.verify(req.cookies.Contractor, secretkey);
    var messageresults = await messagemodel.find({ contractor_username: username });
    res.render('notification', { messageresults });
  }
   catch (error) {
    console.log(error.message);
    res.redirect('/contractorprofile');
  }
});

router.get('/replymessage',isAuthenticated1,(req,res)=>{
  res.render('replymessage');
});
router.post('/replymessage',isAuthenticated1,async (req,res)=>{
  try {
    var result= await messagemodel.updateOne(
      {
        _id:req.body.messageid
      },
      {
        message_status:req.body.status
      }
    );
    res.render('replymessage');
    console.log(result);
  } 
  catch (error) {
    console.log(error.message);
    res.redirect('/contractorprofile');
  }
});

router.get('/viewreplymessage',isAuthenticated2,async (req,res)=>{
try {
  let{username}=jwt.verify(req.cookies.Company,secretkey);
  var results=await messagemodel.find({company_username:username});
  res.render('viewreplymessage',{results});
} 
catch (error) {
  console.log(error.message);
    res.redirect('/companyprofile');
}
});
module.exports = router;
