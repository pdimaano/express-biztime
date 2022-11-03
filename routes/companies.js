"use strict";

const express = require("express");
const router = new express.Router();
const { NotFoundError, BadRequestError } = require("../expressError");

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
            FROM companies;`
  );
  const companies = results.rows;
  return res.json({ companies });
});

/** Find a single company
 *  - requires query param of "/companies/[company_code]""
 *  - Returns JSON obj of single company
 *    - Ex. {company: {code, name, description, invoices: [id, ...]}}
 *  - If company is not found, return 404 status response.
 */
router.get("/:code", async function (req, res, next) {
  const { code } = req.params;
  const cResults = await db.query(
    `SELECT code, name, description
            FROM companies
            WHERE code = $1;`,
    [code]
  );

  const iResults = await db.query(
    `SELECT id
            FROM invoices
            WHERE comp_code = $1;`,
    [code]
  );
  const invoices = iResults.rows.map(i => i.id);

  const company = cResults.rows[0];
  company.invoices = invoices;
  // console.log(company);
  if (!company) throw new NotFoundError(`Not found: ${code}`);
  return res.json({ company });
});

/** Adds a company.
 *
 * - Requires: JSON like {code, name, description}
 * - Returns JSON obj of new company: {company: {code, name, description}}
 *
 */

router.post("/", async function (req, res, next) {
  const { code, name, description } = req.body;
  if (req.body === undefined) throw new BadRequestError();

  const results = await db.query(
    `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description;`,
    [code, name, description]
  );
  const company = results.rows[0];
  return res.status(201).json({ company });
});

/**
 * Update an existing company.
 *
 * - requires param of "/companies/[company_code]""
 * - Requires JSON like: {name, description}
 * - Returns updated object as JSON like: {company: {code, name, description}}
 *
 */

router.put("/:code", async function (req, res, next) {
  const { code } = req.params;
  const { name, description } = req.body;
  if (req.body === undefined) throw new BadRequestError();
  //TODO: test for BOTH name/description
  const results = await db.query(
    `UPDATE companies
            SET name = $2,
                description = $3
            WHERE code = $1
            RETURNING code, name, description;`,
    [code, name, description]
  );

  const company = results.rows[0];
  if (!company) throw new NotFoundError(`Not found: ${code}`);

  return res.json({ company });
});

/** Delete an existing company.
 *
 * - requires param of "/companies/[company_code]"
 * - If company not found, Return 404
 */

router.delete("/:code", async function (req, res, next) {
  const { code } = req.params;

  const results = await db.query(
    `DELETE FROM companies
            WHERE code = $1
            RETURNING code, name, description; `,
    [code]
  );
  const company = results.rows[0];
  if (!company) throw new NotFoundError(`Not found: ${code}`);

  return res.json({ status: "deleted" });
});

module.exports = router;
