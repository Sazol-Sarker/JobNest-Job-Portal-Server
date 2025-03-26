const express = require("express");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

// MIDDLEWARE
app.use(
  cors({
    
    origin: [
      "http://localhost:5173",
      "https://jobnest-job-portal.web.app",
      "https://jobnest-job-portal.firebaseapp.com"
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// RESTRICT UNAUTHORIZED api data access except legal user
// middleware for jwt token verification
const verifyToken=(req,res,next)=>{
const token=req.cookies?.token;
console.log("Token in verifyTOKEN=>",token);
if(!token)
{
  return res.status(401).send({message:'Unauthorized ++ access denied'})
}

jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
  if(err)
  {
    console.error("JWT Verification Error:", err.message); // Log error for debugging
    return res.status(401).send({message:"Forbidden: Invalid token"})
  }

  req.user=decoded 

  next()
})

}

// MONGODB Connection

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uomr8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // DATABASE+Collection
    const jobsCategory = client
      .db("JobPortalDB")
      .collection("JobsBrowseCategoryCollection");
    const jobs = client.db("JobPortalDB").collection("JobsCollection");
    const users = client.db("JobPortalDB").collection("UsersCollection");
    const appliedJobs = client
      .db("JobPortalDB")
      .collection("AppliedJobsCollection");

    // AUTH APIs here + jwt
    app.post("/jwt", (req, res) => {
      const user = req?.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "24h",
      });
      console.log("In JWT=>",token);

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          // secure: process.env.NODE_ENV === "production",
          // sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: "Logged In with jwt cookie" });
    });

    app.post("/logout", (req, res) => {
      // console.log("Executing logoout");
      res.clearCookie("token", {
        httpOnly: true,
        secure: false,
        // secure: process.env.NODE_ENV === "production",
        // sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
      res.send({ message: "Logged out successfully" });
    });

    // ALL APIs here (jobsCategory collection)

    app.get("/jobCategories", async (req, res) => {
      const cursor = jobsCategory.find();
      const result = await cursor.toArray();
      // console.log(result);
      res.send(result);
    });

    // ALL APIs here (jobs collection)
    app.get("/hotJob/:category", async (req, res) => {
      const category = req.params.category;
      const query = { category: category };
      const result = await jobs.find(query).toArray();

      res.send(result);
    });

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobs.findOne(query);
      res.send(result);
    });

    // ALL APIs here (users collection)

    // POST API: create user
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      // console.log("New user data", newUser);
      const result = await users.insertOne(newUser);
      res.send(result);
    });

    // GET api: find/fetch user by email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await users.findOne(query);
      res.send(result);
    });
    // app.get('/appliedJobs/:email',async(req,res)=>{
    app.get("/appliedJobs",verifyToken, async (req, res) => {
      // const email=req.params.email
      const email = req.query?.email;
      // console.log("", req.query?.email);
      // console.log("QUERY EMAIL=>", req.query?.email);
      // const email = 'mevevor916@oziere.com';
      // console.log(
      //   "req.query?.email + req.user.email",
      //   req.query?.email,
      //   req.user?.email
      // );
      // if user does not call the api, no access to data
      if (email !== req.user.email) {
        return res
          .status(401)
          .send({ msg: "User Token wrong, Unauthorised access" });
      }

      // console.log('req.query.email=>',email);
      const query = { applicant_email: email };

      const result = await appliedJobs.find(query).toArray();
      //  console.log(result);
      res.send(result);
    });

    // **************appliedJob Collection************
    // Duplicate data entry into DB-> thus avoiding
    // app.post('/appliedJob',async(req,res)=>{
    //   const appliedJob=req.body
    //   const result=await appliedJobs.insertOne(appliedJob)
    //   res.send(result)

    // })

    app.put("/appliedJob", async (req, res) => {
      const appliedJob = req.body;
      // console.log(appliedJob);
      const {
        applicant_email,
        company_name,
        company_location,
        job_title,
        jobType,
      } = appliedJob;

      // const filter = {
      //   ...appliedJob
      // };

      const filter = {
        applicant_email: applicant_email,
        company_name: company_name,
        company_location: company_location,
        job_title: job_title,
        jobType: jobType,
      };

      const newAppliedJob = {
        $set: {
          applicant_email: applicant_email,
          company_name: company_name,
          company_location: company_location,
          job_title: job_title,
          jobType: jobType,
        },
      };

      const options = { upsert: true };
      const result = await appliedJobs.updateOne(
        filter,
        newAppliedJob,
        options
      );
      res.send(result);
    });

    // DELETE a appliedjob
    app.delete('/appliedJob/:id',async(req,res)=>{
      const id=req.params.id;
      console.log(id);
      const query={_id:new ObjectId(id)}

      const result=await appliedJobs.deleteOne(query)

      res.send(result)
      // res.send([])
    })

    /*********************/

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// server APIs

app.get("/", (req, res) => {
  res.send("Job portal server is running...");
});

// Listen to post: MUST
app.listen(port, () => {
  console.log("Listening to port=>", port);
});
