import { Router } from "express";
import bcrypt from "bcrypt";
import pool from "../db.js";

const router = Router();

router.post("/signup", async(req, res) => {
    const {username, password, email} = req.body
    const hashedpass = await bcrypt.hash(password , 10)
    const signupuser= await pool.query(`INSERT INTO users (username,password_hash,email) VALUES($1,$2,$3) RETURNING *`, [username, hashedpass, email]);
    res.status(200).json(signupuser.rows[0])
});

router.post("/login", async(req, res) => {
    const {email, password} = req.body
    const hash_pass = await pool.query(`SELECT password_hash,id,username,description FROM users WHERE email= $1`, [email])
    const compare = await bcrypt.compare(password, hash_pass.rows[0].password_hash)
    res.status(200).json({compare, id: hash_pass.rows[0].id, name: hash_pass.rows[0].username, description: hash_pass.rows[0].description})
});




export default router;
