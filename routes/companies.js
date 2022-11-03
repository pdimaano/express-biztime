"use strict";

const express = require("express");
const router = new express.Router();

const db = require("../db.js");

/** Find all companies
 *
 * - Returns full list of companies as JSON
 * - Ex. {companies: [{code, name}, ...]}
 */
router.get("/", async function (req, res, next) {
  // console.log("Get companies successful")
  const results = await db.query(
    `SELECT code, name
            FROM companies`);
  const companies = results.rows;
  return res.json({ companies });
});

/** Find a single company
 *  - requires query param of "/companies/[company_code]""
 *  - Returns JSON obj of single company
 *    - Ex. {company: {code, name, description}}
 *  - If company is not found, return 404 status response.
 */
router.get("/:code", async function (req, res, next) {
  const { code } = req.params;
  const results = await db.query(
    `SELECT code, name, description
            FROM companies
            WHERE code = $1`, [code]);
  const company = results.rows;
  return res.json({ company });
});


/** Adds a company.
 *
 * - Requires: JSON like {code, name, description}
 * - Returns JSON obj of new company: {company: {code, name, description}}
 *
 */

router.post("/", async function (req, res, next) {
  const { code, name, description } = req.params;

  const results = await db.query(
    `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`, [code, name, description]);
  const company = results.rows;
  return res.json({ company });
});


module.exports = router;;;;;