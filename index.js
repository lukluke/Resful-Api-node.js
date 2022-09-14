const express = require('express')
const bodyParser = require('body-parser')
const app = express()
var multer  = require('multer')
var upload = multer()
var hat = require('hat');
var crypto = require('crypto');

var request = require('request');
var mysql = require('mysql');
var dateTime = require('node-datetime');
var dateformat = require('dateformat');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



app.use(function (req, res, next) {

    //res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
 

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST,HEAD, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


var con = mysql.createConnection({
  host: "localhost",
  user: "username1",
  password: "password",
  database: "test",
 
});

con.connect(function(err) {
  if (err) throw err;
  var dt = dateTime.create();
  var formattedDt = dt.format('Y-m-d H:M:S');

  console.log("MySQL Connected!" + formattedDt);
});


var appApi = express.Router();
app.use('/api', appApi);

appApi.get('/movie',function(req,res){
  var output = [];
  var id = req.query.id;
  //var id = "00001";
  var sql ="SELECT * FROM `movies` ";
  con.query(sql, [id], function(err, result) {
    for(var i = 0; i < result.length; i++) {
      output.push({
         ...result[i]
        
      });
    }
    res.json(output);
    return;
    
  });
});


appApi.post('/login', upload.array(),(req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    var passwordHash = password.hash();
    var sql = 'SELECT `mid`,`email`,`password` FROM `Member` WHERE `email`="'+email+'" AND `password` = "'+passwordHash+'"';
    var token = (email + "SAMMINGONCE&ALWAYS" + hat()).shuffle();
    var tokenHash = token.hash();
    con.query(sql,function(err, result) {
        if(result[0] != null){
        let sql2 = 'UPDATE `Member` SET `token`="'+tokenHash+'" WHERE `mid`="'+result[0].mid+'"';
        con.query(sql2);
        res.json({
            "status": "1",
            "token":tokenHash
        });
        return;

     }else{
        res.json({
            "status": "0",
        });
        return;
     }
    });
});


appApi.post('/register', upload.array(),(req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    let nickname = req.body.nickname;
    var passwordHash = password.hash();
    var sql = 'INSERT INTO `Member` (`mid`, `email`, `password`, `nickname`, `token`, `createTime`) VALUES (NULL, "'+email+'", "'+passwordHash+'", "'+nickname+'", "", CURRENT_TIMESTAMP)';
        con.query(sql,function(err, result) {

        if(err) {
          throw err;
          return;
        }
        if(result.affectedRows > 0) {
          res.json({"status": 1});
        } else {
          res.json({"status":0});
        }
    });
});

appApi.post('/forgotPassword', upload.array(),(req, res) => {
    let email = req.body.email;
    var sql = 'SELECT `mid`,`email` FROM `Member` WHERE `email`="'+email+'"';
   
    con.query(sql,function(err, result) {
        if(result[0] != null){
        res.json({
            "status": "1",
            "mid":result[0].mid
        });
        return;

     }else{
        res.json({
            "status": "0",
        });
        return;
     }
    });
});


appApi.post('/resetPassword', upload.array(),(req, res) => {
    let password = req.body.password;
    var passwordHash = password.hash();
    let mid = req.body.mid;
    var sql = 'UPDATE `Member` SET `password` = "'+passwordHash+'" WHERE `Member`.`mid` = "'+mid+'"';
    console.log(sql);
   
    con.query(sql,function(err, result) {

      if(result.affectedRows > 0){
        res.json({
            "status": "1",
        });
        return;
     }else{
        res.json({
            "status": "0",
        });
        return;
     }
    });
});


appApi.post('/getNotes',upload.array(),function(req,res){
  var output = [];
  let token = req.body.token;
  var sql = 'SELECT * FROM `Member` WHERE `token`="'+token+'"';
 
  con.query(sql, function(err, result) {

    if(result[0] != null){
      var sql2 = 'SELECT * FROM `Notes`,`shareNotice` WHERE `Notes`.`nid` = `shareNotice`.`nid` and `shareNotice`.`uid` = "'+result[0].mid+'" ';
      con.query(sql2, function(err, result2) {
               for(var i = 0; i < result2.length; i++) {
                output.push({"status":1,
                   ...result2[i]
                  
                });
              }
              res.json(output);
              return;
       });

    }else{
      res.json({
            "status": "0",
        });
      return;

    }  
  });
});


appApi.post('/insertNotes',upload.array(),function(req,res){
  var output = [];
  let token = req.body.token;
  // let nid = req.body.nid;
  let notes_title = req.body.notes_title;
  let notes_detail = req.body.notes_detail;
  let color = req.body.color;
  let fontsize = req.body.fontsize;
  let bigsize = req.body.bigsize;
  let fromDate = req.body.fromDate;
  let toDate = req.body.toDate;
  let status = req.body.status;


  var sql = 'SELECT * FROM `Member` WHERE `token`="'+token+'"';
 
  con.query(sql, function(err, result) {

    if(result[0] != null){
      var sql2 = 'INSERT INTO `Notes` (`nid`, `notes_title`, `notes_detail`, `color`, `fontsize`, `bigsize`, `fromDate`, `toDate`, `uid`,`status`) VALUES (NULL, "'+notes_title+'", "'+notes_detail+'", "'+color+'", "'+fontsize+'", "'+bigsize+'", "'+fromDate+'", "'+toDate+'", "'+result[0].mid+'","'+status+'")';
      console.log(sql2);
      con.query(sql2, function(err, result2) {
     
           var sql = 'INSERT INTO `shareNotice` (`sid`, `uid`, `nid`) VALUES (NULL, "'+result[0].mid+'", "'+result2.insertId+'")';
           console.log(sql);
            con.query(sql, function(err, result2) {});
           if(result2.affectedRows > 0){
              res.json({
                  "status": "1",
                  "nid":result2.insertId
              });
              return; 
           }else{
              res.json({
                  "status": "0",
              });
              return;
           }
       });

    }else{
      res.json({
            "status": "0",
        });
      return;
    }  
  });
});


appApi.post('/shareNote',upload.array(),function(req,res){
  var output = [];
  let token = req.body.token;
  let nid = req.body.nid;
  let email = req.body.email;


  var sql = 'SELECT * FROM `Member` WHERE `token`="'+token+'"';
 
  con.query(sql, function(err, result) {

    if(result[0] != null){
      var sql2 = 'SELECT * FROM `Member` WHERE `email`="'+email+'"';
    
      con.query(sql2, function(err, result2) {
            console.log(result2);
            
           var sql = 'INSERT INTO `shareNotice` (`sid`, `uid`, `nid`) VALUES (NULL, "'+result2[0].mid+'", "'+nid+'")';

           console.log(sql);
           con.query(sql, function(err, result3) {
              if(result3.affectedRows > 0){
                res.json({
                    "status": "1",
                });
                return;
             }else{
                res.json({
                    "status": "0",
                });
                return;
              }



           });
           
       });

    }else{
      res.json({
            "status": "0",
        });
      return;
    }  
  });
});



appApi.post('/getNotePassword',upload.array(),function(req,res){
  var output = [];
  let token = req.body.token;
  let nid = req.body.nid;
  let note_password = req.body.note_password;


  var sql = 'SELECT * FROM `Member` WHERE `token`="'+token+'"';
 
  con.query(sql, function(err, result) {

    if(result[0] != null){
      var sql2 = 'SELECT * FROM `Notes` WHERE `note_password`="'+note_password+'" and `nid`  ="'+nid+'"';
      console.log(sql2);
      con.query(sql2, function(err, result2) {
    
           if(result2[0] != null){
              res.json({
                  "status": "1",
              });
              return;
           }else{
              res.json({
                  "status": "0",
              });
              return;
           }
       });

    }else{
      res.json({
            "status": "0",
        });
      return;
    }  
  });
});

appApi.post('/getNotesDetail',upload.array(),function(req,res){
  var output = [];
  let token = req.body.token;
  let nid = req.body.nid;


  var sql = 'SELECT * FROM `Member` WHERE `token`="'+token+'"';
 
  con.query(sql, function(err, result) {

    if(result[0] != null){
      var sql2 = 'SELECT * FROM `Notes` WHERE `nid`  ="'+nid+'"';
      console.log(sql2);
      con.query(sql2, function(err, result2) {
    
           if(result2[0] != null){
              res.json({
                  "status": "1",
                  "notes_title":result2[0].notes_title,
                  "notes_detail":result2[0].notes_detail,
              });
              return;
           }else{
              res.json({
                  "status": "0",
              });
              return;
           }
       });

    }else{
      res.json({
            "status": "0",
        });
      return;
    }  
  });
});







appApi.post('/editNotes',upload.array(),function(req,res){
  var output = [];
  let token = req.body.token;
  let nid = req.body.nid;
  let notes_title = req.body.notes_title;
  let notes_detail = req.body.notes_detail;
  let color = req.body.color;
  let fontsize = req.body.fontsize;
  let bigsize = req.body.bigsize;
  let fromDate = req.body.fromDate;
  let toDate = req.body.toDate;

  var sql = 'SELECT * FROM `Member` WHERE `token`="'+token+'"';
 
  con.query(sql, function(err, result) {

    if(result[0] != null){
      var sql2 = 'UPDATE `Notes` SET `notes_title` = "'+notes_title+'", `notes_detail` = "'+notes_detail+'", `color` = "'+color+'", `fontsize` = "'+fontsize+'", `bigsize` = "'+bigsize+'", `fromDate` = "'+fromDate+'", `toDate` = "'+fromDate+'" WHERE `Notes`.`nid` = "'+nid+'"';
      console.log(sql2);
      con.query(sql2, function(err, result2) {
           console.log(result2)
           if(result2.affectedRows > 0){
              res.json({
                  "status": "1",
              });
              return;
           }else{
              res.json({
                  "status": "0",
              });
              return;
           }
       });

    }else{
      res.json({
            "status": "0",
        });
      return;
    }  
  });
});


appApi.post('/editColor',upload.array(),function(req,res){
  var output = [];
  let token = req.body.token;
  let nid = req.body.nid;
  let color = req.body.color;

  var sql = 'SELECT * FROM `Member` WHERE `token`="'+token+'"';
 
  con.query(sql, function(err, result) {

    if(result[0] != null){
      var sql2 = 'UPDATE `Notes` SET  `color` = "'+color+'" WHERE `Notes`.`nid` = "'+nid+'"';
      console.log(sql2);
      con.query(sql2, function(err, result2) {
           console.log(result2)
           if(result2.affectedRows > 0){
              res.json({
                  "status": "1",
              });
              return;
           }else{
              res.json({
                  "status": "0",
              });
              return;
           }
       });

    }else{
      res.json({
            "status": "0",
        });
      return;
    }  
  });
});

appApi.post('/editTitle',upload.array(),function(req,res){
  var output = [];
  let token = req.body.token;
  let nid = req.body.nid;
  let notes_title = req.body.notes_title;


  var sql = 'SELECT * FROM `Member` WHERE `token`="'+token+'"';
 
  con.query(sql, function(err, result) {

    if(result[0] != null){
      var sql2 = 'UPDATE `Notes` SET `notes_title` = "'+notes_title+'" WHERE `Notes`.`nid` = "'+nid+'"';
      con.query(sql2, function(err, result2) {
    
           if(result2.affectedRows > 0){
              res.json({
                  "status": "1",
              });
              return;
           }else{
              res.json({
                  "status": "0",
              });
              return;
           }
       });

    }else{
      res.json({
            "status": "0",
        });
      return;
    }  
  });
});


appApi.post('/editStatus',upload.array(),function(req,res){
  var output = [];
  let token = req.body.token;
  let nid = req.body.nid;
  let status = req.body.status;


  var sql = 'SELECT * FROM `Member` WHERE `token`="'+token+'"';
 
  con.query(sql, function(err, result) {

    if(result[0] != null){
      var sql2 = 'UPDATE `Notes` SET `status` = "'+status+'" WHERE `Notes`.`nid` = "'+nid+'"';
      con.query(sql2, function(err, result2) {
    
           if(result2.affectedRows > 0){
              res.json({
                  "status": "1",
              });
              return;
           }else{
              res.json({
                  "status": "0",
              });
              return;
           }
       });

    }else{
      res.json({
            "status": "0",
        });
      return;
    }  
  });
});


appApi.post('/editPassword',upload.array(),function(req,res){
  var output = [];
  let token = req.body.token;
  let nid = req.body.nid;
  let note_password = req.body.note_password;


  var sql = 'SELECT * FROM `Member` WHERE `token`="'+token+'"';
 
  con.query(sql, function(err, result) {

    if(result[0] != null){
      var sql2 = 'UPDATE `Notes` SET `note_password` = "'+note_password+'" WHERE `Notes`.`nid` = "'+nid+'"';
      console.log(sql2);
      con.query(sql2, function(err, result2) {
    
           if(result2.affectedRows > 0){
              res.json({
                  "status": "1",
              });
              return;
           }else{
              res.json({
                  "status": "0",
              });
              return;
           }
       });

    }else{
      res.json({
            "status": "0",
        });
      return;
    }  
  });
});



appApi.post('/editdetail',upload.array(),function(req,res){
  var output = [];
  let token = req.body.token;
  let nid = req.body.nid;
  let notes_detail = req.body.notes_detail;


  var sql = 'SELECT * FROM `Member` WHERE `token`="'+token+'"';
 
  con.query(sql, function(err, result) {

    if(result[0] != null){
      var sql2 = 'UPDATE `Notes` SET `notes_detail` = "'+notes_detail+'" WHERE `Notes`.`nid` = "'+nid+'"';
      con.query(sql2, function(err, result2) {
    
           if(result2.affectedRows > 0){
              res.json({
                  "status": "1",
              });
              return;
           }else{
              res.json({
                  "status": "0",
              });
              return;
           }
       });

    }else{
      res.json({
            "status": "0",
        });
      return;
    }  
  });
});


appApi.post('/editfontSize',upload.array(),function(req,res){
  var output = [];
  let token = req.body.token;
  let nid = req.body.nid;
  let fontsize = req.body.fontsize;


  var sql = 'SELECT * FROM `Member` WHERE `token`="'+token+'"';
 
  con.query(sql, function(err, result) {

    if(result[0] != null){
      var sql2 = 'UPDATE `Notes` SET `fontsize` = "'+fontsize+'" WHERE `Notes`.`nid` = "'+nid+'"';
      con.query(sql2, function(err, result2) {
    
           if(result2.affectedRows > 0){
              res.json({
                  "status": "1",
              });
              return;
           }else{
              res.json({
                  "status": "0",
              });
              return;
           }
       });

    }else{
      res.json({
            "status": "0",
        });
      return;
    }  
  });
});


appApi.post('/editSize',upload.array(),function(req,res){
  var output = [];
  let token = req.body.token;
  let nid = req.body.nid;
  let width = req.body.width;
  let height = req.body.height;


  var sql = 'SELECT * FROM `Member` WHERE `token`="'+token+'"';
 
  con.query(sql, function(err, result) {

    if(result[0] != null){
      var sql2 = 'UPDATE `Notes` SET `height` = "'+height+'px", `width` = "'+width+'px"  WHERE `Notes`.`nid` = "'+nid+'"';
      con.query(sql2, function(err, result2) {
    
           if(result2.affectedRows > 0){
              res.json({
                  "status": "1",
              });
              return;
           }else{
              res.json({
                  "status": "0",
              });
              return;
           }
       });

    }else{
      res.json({
            "status": "0",
        });
      return;
    }  
  });
});


appApi.post('/editPosition',upload.array(),function(req,res){
  var output = [];
  let token = req.body.token;
  let nid = req.body.nid;
  let left_position = req.body.left_position;
  let top_position = req.body.top_position;


  var sql = 'SELECT * FROM `Member` WHERE `token`="'+token+'"';
 
  con.query(sql, function(err, result) {

    if(result[0] != null){
      var sql2 = 'UPDATE `Notes` SET `top_position` = "'+top_position+'", `left_position` = "'+left_position+'"  WHERE `Notes`.`nid` = "'+nid+'"';
      con.query(sql2, function(err, result2) {
    
           if(result2.affectedRows > 0){
              res.json({
                  "status": "1",
              });
              return;
           }else{
              res.json({
                  "status": "0",
              });
              return;
           }
       });

    }else{
      res.json({
            "status": "0",
        });
      return;
    }  
  });
});

appApi.post('/deleteNotes',upload.array(),function(req,res){
  var output = [];
  let token = req.body.token;
  let nid = req.body.nid;
  var sql = 'SELECT * FROM `Member` WHERE `token`="'+token+'"';
 
  con.query(sql, function(err, result) {

    if(result[0] != null){
      var sql2 = 'DELETE FROM `Notes` WHERE `nid` = "'+nid+'"';
      con.query(sql2, function(err, result2) {
           console.log(result2)
           var sql3 = 'DELETE FROM `shareNotice` WHERE `nid` = "'+nid+'"';
           con.query(sql3);
           if(result2.affectedRows > 0){
              res.json({
                  "status": "1",
              });
              return;
           }else{
              res.json({
                  "status": "0",
              });
              return;
           }
       });

    }else{
      res.json({
            "status": "0",
        });
      return;

    }  
  });
});




app.post('/send', upload.array(),(req, res) => {
    let formData = req.body;
    console.log('form data', formData);
    res.status(200).send(formData);
  });


Date.prototype.withoutTime = function () {
    var d = new Date(this);
    d.setHours(0, 0, 0, 0);
    return d;
}
Date.prototype.daysBetween = function(date2) {
  //Get 1 day in milliseconds
  var one_day=1000*60*60*24;

  // Convert both dates to milliseconds
  var date1_ms = this.withoutTime().getTime();
  var date2_ms = date2.withoutTime().getTime();

  // Calculate the difference in milliseconds
  var difference_ms = date2_ms - date1_ms;
    
  // Convert back to days and return
  return difference_ms / one_day;
}
Date.prototype.addDays = function(days) {
  var dat = new Date(this.valueOf());
  dat.setDate(dat.getDate() + days);
  return dat;
}
String.prototype.shuffle = function () {
    var a = this.split(""),
        n = a.length;

    for(var i = n - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    return a.join("");
}
String.prototype.hash = function() {
  return crypto.createHash('sha512').update(this.slice(0)).digest('hex').toUpperCase();
}
function isNormalInteger(str) {
    return /^\+?([1-9]\d*)$/.test(str);
}

app.listen(3000, () => console.log('Example app listening on port 3000!'))