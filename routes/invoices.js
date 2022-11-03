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

/** Adds an invoice.
 *
 * - Requires: JSON like {comp_code, amt}
 * - Returns JSON obj of new invoice: {invoice: {id, comp_code, amt, paid,
 *                                     add_date, paid_date}}
 *
 */

router.post("/", async function (req, res, next) {
  if (req.body === undefined) throw new BadRequestError();
  const { comp_code, amt } = req.body;
  if (!comp_code || !amt) throw new BadRequestError();

  const results = await db.query(
    `INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date;`,
    [comp_code, amt]
  );
  const invoice = results.rows[0];
  if (!invoice) throw new BadRequestError();
  return res.status(201).json({ invoice });
});

/**
 *  Update an existing invoice.
 *
 * - requires param of "/invoices/[id]""
 * - Requires JSON like: {amt}
 * - Returns updated object as JSON like: {invoice: {id, comp_code, amt,
 *                                         paid, add_date, paid_date}}
 * - If invoice is not found, return 404 error.
 *
 */

router.patch("/:id", async function (req, res, next) {
  if (req.body === undefined) throw new BadRequestError();
  const { id } = req.params;
  const { amt } = req.body;
  if (!Number(amt)) throw new BadRequestError();
  // console.log(amt);
  const results = await db.query(
    `UPDATE invoices
            SET amt = amt - $2
            WHERE id = $1
            RETURNING id, comp_code, amt, paid, add_date, paid_date;`,
    [id, amt]
  );

  const invoice = results.rows[0];
  if (!invoice) throw new NotFoundError(`Not found: ${id}`);

  return res.json({ invoice });
});

/** Delete an existing invoice.
 *
 * - requires param of "/invoices/[id]"
 * - If company not found, Return 404
 */

router.delete("/:id", async function (req, res, next) {
  const { id } = req.params;

  const results = await db.query(
    `DELETE FROM invoices
            WHERE id = $1
            RETURNING id, comp_code;`,
    [id]
  );
  const invoice = results.rows[0];
  if (!invoice) throw new NotFoundError(`Not found: ${id}`);

  return res.json({ status: "deleted" });
});

module.exports = router;
