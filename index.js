const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const app = express()
const uri = process.env.MONGODB_URI;
const port = process.env.PORT || 5000;
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());



app.get('/', (req, res) => {
  res.send('Hello User In RecipeHUB Server !')
})


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// { Database collection created here }

const database = client.db("RecipyHubproject");
const recipesCollection = database.collection("recipes");
const paymentCollection = database.collection("payments");
const UserCollection = database.collection("user");
const favouriteCollection = database.collection("favourite");
const favouritecountCollection = database.collection("favouritecount");
const likecountCollection = database.collection("likescount");
const reportCollection = database.collection("reports");
const featuredCollection = database.collection("featured");
const recipePaymentCollection = database.collection("recipePayment");  
const sessionCollection = database.collection("session");  


// varify User Token 
const JWKS = createRemoteJWKSet (
  new URL ('http://localhost:3000/api/auth/jwks')
)
const VerifyToken = async (req, res, next) => {
  

const  authHeader = req.headers.authorization
const  id = req.headers.user
// console.log(req.headers)
 
if(!authHeader){
    return res.status(401).send({
    message: "Unauthorized access",
  });
  } 
  const Token = authHeader.split(' ')[1] 
  if(!Token){
     return res.status(401).send({
    message: "Unauthorized access",
  });
  } 
  try{
    const { payload } = await jwtVerify(Token , JWKS)
    console.log(payload)
    
  }catch(error){
    return res.status(403).send({ message : 'Forbidden'})
  }
   
  
  const UserId = new ObjectId(id)
  const user = await UserCollection.findOne({ _id : UserId })
  // console.log(user)
    req.user = user
  next();
}; 

// must call after VerifyToken function 

const VerifyAdmin = async (req , res , next ) => {
  const user = req.user  
  if(user?.role !== 'Admin'){
    return res.status(403).send({ message : 'forbidden access'})
  }
  // console.log(user) 
  next()
}

// must call after VerifyToken function 

const Verifyuser = async (req , res , next ) => {
  const user = req.user  
  if(user?.role !== 'User'){
    return res.status(403).send({ message : 'forbidden access'})
  }
  // console.log(user) 
  next()
}



// { Data Get API } 

app.get( '/api/payments' ,  VerifyToken , VerifyAdmin , async (req , res ) => {
  const result = await paymentCollection.find().toArray();
  res.send(result)
})

app.get('/api/favourite' ,  VerifyToken , Verifyuser ,  async ( req , res ) => {
  const {id , recipeid } = req.query ;
  let query = {};
  if(id){
    query = { userid : id }
  }
  if(recipeid){
    query = { recipeid : recipeid }
  }
  const result = await favouriteCollection.find(query).toArray() 
  res.send(result)
})


app.get('/api/featured' , async (req , res ) => {
  const result = await featuredCollection.find().toArray() 
  res.send(result)
})


app.get('/api/likescount' ,  async ( req , res ) => {
  const { recipeid , authorEmail } = req.query ;
  let query = {};
 
  if(recipeid){
    query = { recipeid : recipeid }
  }

  if(authorEmail){
    query = { authorEmail: authorEmail}
  }
  const result = await likecountCollection.find(query).toArray() 
  res.send(result)
})


app.get('/api/report' ,  VerifyToken , VerifyAdmin ,   async (req , res ) => {
  const result =  await reportCollection.find().toArray()
  res.send(result)
})




app.get("/api/user",  VerifyToken , VerifyAdmin , async (req, res) => {
  try {
    const { role  , isPremium} = req.query;
    // console.log(email , id )
    let query = {};
    if(isPremium){
      query = { isPremium : isPremium }
    }
   
    if(role) {
      query = { role : role}
    }

    const result = await UserCollection.find(query).toArray();

    res.json(result);
  } catch (error) {
    console.error("GET error:", error); 
    res.status(500).send({ success: false, message: error.message });
  }
});



app.get("/api/recipepayments",  VerifyToken ,  async (req, res) => {
  try {
    const { email } = req.query;
  
    let query = {};
    
    
    if(email) {
      query = { email : email}
    }

    const result = await recipePaymentCollection.find(query).toArray();

    res.json(result);
  } catch (error) {
    console.error("GET error:", error); 
    res.status(500).send({ success: false, message: error.message });
  }
});


app.get("/api/recipes",  async (req, res) => {
  try {
    const { id, email, likesCount , category} = req.query;
    
    // console.log(category )
    let query = {};
    
    if (likesCount) {
      query.likesCount = { $gte: Number(likesCount) };
    }

    if (id) {
      query = { _id: new ObjectId(id) };
    }
    if(email) {
      query = { authorEmail : email}
    } 
  if (category) {
      query.category = {
        $in: category.split(","),
      };
    }

    


    const result = await recipesCollection.find(query).toArray();

    res.json(result);
  } catch (error) {
    console.error("GET error:", error); 
    res.status(500).send({ success: false, message: error.message });
  }
});
 

// { Data Delete API }

app.delete("/api/favourite/:id", VerifyToken , Verifyuser ,   async (req, res) => {
try{
 const id = req.params.id 
  const result = await favouriteCollection.deleteOne({
    
  recipeid : id 
  })
  res.send(result)
 }
catch(error){
  res.status(500).send({ success: false, message: error.message });
}}) 




app.delete("/api/report/:id", VerifyToken , VerifyAdmin , async (req, res) => {
try{
 const id =  new ObjectId(req.params.id) 
  const result = await reportCollection.deleteOne({
    _id : id 
  })
  res.send(result)
 }
catch(error){
  res.status(500).send({ success: false, message: error.message });
}})




app.delete("/api/recipes/:id", VerifyToken , async (req, res) => {
try{
 const id =  new ObjectId(req.params.id) 
  const result = await recipesCollection.deleteOne({
    _id : id 
  })
  res.send(result)
 }
catch(error){
  res.status(500).send({ success: false, message: error.message });
}})
 



// { Data Edit API }

app.patch('/api/recipes/:id',  VerifyToken ,  async (req, res) => {
  try {
    const id = new ObjectId(req.params.id)  ;
    const Data = req.body
    // console.log(Data)
    const newdata = {
      $set: {
            recipeName: Data.recipeName,
            recipeImage: Data.recipeImage,
    
            category :  Data.category ,
            cuisineType: Data.cuisineType,
            difficultyLevel: Data.difficultyLevel ,
            preparationTime: Data.preparationTime ,
            ingredients: Data.ingredients ,
            instructions: Data.instructions ,
             likesCount : Data.likesCount || 0 ,
            isFeatured: Data.isFeatured ,
            status : Data.status ,
            updatedAt : new Date()
      },
    };

    const result = await recipesCollection.updateOne(
      { _id :  id },
      newdata
    );

    res.json(result);
  } catch (error) {
    console.error("PATCH error:", error);
    res.status(500).send({ success: false, message: error.message });
  }
});



app.patch('/api/user/:email', VerifyToken ,   async (req, res) => {
  try {
    const email = req.params.email;
    
    const newdata = {
      $set: {
        isPremium: req.body?.isPremium,
        image: req.body?.image,
        name: req.body?.name, 
        isBlocked : req.body?.isBlocked
      },
    };

    const result = await UserCollection.updateOne(
      { email },
      newdata
    );

    res.json(result);
  } catch (error) {
    console.error("PATCH error:", error);
    res.status(500).send({ success: false, message: error.message });
  }
});



// { Data Post API }

app.post('/api/featured' , VerifyToken , VerifyAdmin ,  async(req , res ) => {
  const Data = req.body 
  const NewData = {
    ... Data , updatedAt : new Date() 
  }
  const result = await featuredCollection.insertOne(NewData)
  res.send(result)
})



app.post('/api/favourite' , VerifyToken , Verifyuser , async(req , res ) => {
  const Data = req.body 
  const NewData = {
    ... Data , updatedAt : new Date() 
  }
  const result = await favouriteCollection.insertOne(NewData)
  res.send(result)
})



app.post('/api/likescount' , VerifyToken , Verifyuser , async(req , res ) => {
  const Data = req.body 
  const NewData = {
    ... Data , updatedAt : new Date() 
  }
  const result = await likecountCollection.insertOne(NewData)
  res.send(result)
})


app.post('/api/report' , VerifyToken , Verifyuser ,  async(req , res ) => {
  const Data = req.body 
  const NewData = {
    ... Data , createdAt : new Date() 
  }
  const result = await reportCollection.insertOne(NewData)
  res.send(result)
})


app.post('/api/recipepayments' , VerifyToken , Verifyuser ,  async(req , res ) => {
  const Data = req.body 
  const NewData = {
    ... Data , updatedAt : new Date() 
  }
  const result = await recipePaymentCollection.insertOne(NewData)
  res.send(result)
})



app.post('/api/payments' , VerifyToken , Verifyuser ,  async(req , res ) => {
  const Data = req.body 
  const NewData = {
    ... Data , updatedAt : new Date() 
  }
  const result = await paymentCollection.insertOne(NewData)
  res.send(result)
})



app.post('/api/recipes' , VerifyToken , Verifyuser ,  async(req , res ) => {
  const Data = req.body 
  const NewData = {
    ... Data , createdAt : new Date() , updatedAt : new Date()
  }
  const result = await recipesCollection.insertOne(NewData)
  res.send(result)
})

async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error(error);
  }
}

run();


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})