"use strict";

const express = require("express");
const router = new express.Router();
const { NotFoundError, BadRequestError } = require("../expressError");

const db = require("../db.js");

/** Find all invoices
 *
 * - Returns full list of invoices as JSON
 * - Ex. {invoices: [{id, comp_code}, ...]}
 */
router.get("/", async function (req, res, next) {
  // console.log("Get invoices successful")
  const results = await db.query(
    `SELECT id, comp_code
            FROM invoices;`
  );
  const invoices = results.rows;
  return res.json({ invoices });
});

/** Find a single invoice
 *  - requires query param of "/invoices/[id]""
 *  - Returns JSON obj of given invoice
 *    - Ex. {invoice: {id, amt, paid, add_date, paid_date,
 *           company: {code, name, description}}}
 *  - If invoice is not found, return 404 status response.
 */
router.get("/:id", async function (req, res, next) {
  const { id } = req.params;
  const iResults = await db.query(
    `SELECT id, comp_code, amt, paid, add_date, paid_date
            FROM invoices
            WHERE id = $1;`,
    [id]
  );
  const invoice = iResults.rows[0];

  const code = invoice.comp_code;
  const cResults = await db.query(
    `SELECT code, name, description
            FROM companies
            WHERE code = $1;`,
    [code]
  );
  const company = cResults.rows[0];
  invoice.company = company;
  delete invoice.comp_code;

  console.log(invoice);
  if (!invoice) throw new NotFoundError(`Not found: ${id}`);
  if (!company) throw new NotFoundError(`Not found: ${code}`);
  return res.json({ invoice });
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
