import pkg from "pg"
// require('dotenv').config();
import dotenv from 'dotenv';
dotenv.config();
const {Pool} = pkg


const pool = new Pool({
 connectionString: process.env.DATABASE_URL,  
  ssl: { rejectUnauthorized: false } 
})

pool.connect()
  .then(() => console.log("Connected to Postgres DB"))
  .catch((err) => console.error("DB connection error:", err));

export default pool;