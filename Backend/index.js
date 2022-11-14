const express=require('express')
var cors = require('cors')

const Jwt=require('jsonwebtoken')
const jwtKey='E-Commerce'

var app = express()
app.use(cors())
require('./db/config')
const Users=require('./db/Users');
const Product=require('./db/products')
app.use(express.json())


app.post("/register",async(req,resp)=>{
   let user=new Users(req.body);
   let result= await user.save();
   result=result.toObject();
   delete result.password;
   Jwt.sign({result},jwtKey,{expiresIn:"2h"},(err,token)=>{
      if(err){
         resp.send({result:'Something Went Wrong Please Try After Sometime...'});
      }
      resp.send({result,auth:token});
   })
})
app.post("/login", async(req,resp)=>{
   console.log(req.body)
   if(req.body.password && req.body.email){
      let user =await Users.findOne(req.body).select("-password");
      if(user){
         Jwt.sign({user},jwtKey,{expiresIn:"2h"},(err,token)=>{
            if(err){
               resp.send({result:'Something Went Wrong Please Try After Sometime...'});
            }
            resp.send({user,auth:token});
         })
      }
      else{
         resp.send({result:'No user found'});
      }
   }
   else{
       resp.send({result:'No user found'});
   }
  
})
app.post("/add-product",verifyToken,async(req,resp)=>{
   let product=new Product(req.body);
   let result=await product.save();
   resp.send(result)
})

app.get("/products",verifyToken, async(req,resp)=>{
   let products= await Product.find();
   if(products.length >0){
      resp.send(products)
   }
   else{
      resp.send({result:"No Products Found"})
   }
})

app.delete("/product/:id",verifyToken,async(req,resp)=>{
   const result=await Product.deleteOne({_id:req.params.id})
   resp.send(result);
})
app.get("/product/:id",verifyToken,async(req,resp)=>{
   let result=await Product.findOne({_id:req.params.id});
   if(result){
      resp.send(result);
   }
   else{
      resp.send({result:"No Record Found"})
   }
})

app.put("/product/:id",verifyToken,async(req,resp)=>{
   let result=await Product.updateOne(
      {_id: req.params.id},
      {
         $set:req.body
      }
   )
   resp.send(result)
})
app.get("/search/:key",verifyToken,async(req,resp)=>{
   let result=await Product.find({
      "$or":[
         {name:{$regex:req.params.key}},
         {company:{$regex:req.params.key}},
         {category:{$regex:req.params.key}},

         
      ]
   })
   resp.send(result);
})
function verifyToken(req,resp,next){
   let token=req.headers['authorization'];
   if(token){
      token=token.split(' ')[1];
      
      Jwt.verify(token,jwtKey,(err,valid)=>{
         if(err){
            resp.status(401).send({result:"Please Provide Valid Token..."})
         }
         else{
             next()
         }
      })
   }
   else{
      resp.status(403).send({result :"Please Add Token With Header"})
   }

   
}
 app.listen(5000);