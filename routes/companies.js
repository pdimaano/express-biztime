"use strict";

const express = require("express");
const router = new express.Router();

const db = require("../db.js");

/** GET /companies Returns full list of companies
 *  Ex. {companies: [{code, name}, ...]}
 */
router.get("/", async function (req, res, next) {
  // console.log("Get companies successful")
  const results = await db.query(
    `SELECT code, name
            FROM companies`);
  const companies = results.rows;
  return res.json({ companies });
});

/** GET /companies/[code] Returns obj of company
 *  Ex. {company: {code, name, description}}
 *  If company is not found, return 404 status response.
 */
router.get("/:code", async function (req, res, next) {
  const code = req.params.code;
  console.log(code)
  const results = await db.query(
    `SELECT code, name, description
            FROM companies
            WHERE code = $1`, [code]);
  const company = results.rows;
  return res.json({ company });
});


module.exports = router;