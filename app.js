"use strict";

/** BizTime express application. */

const express = require("express");
const app = express();
const compRoute = require("./routes/companies");
const invRoute = require("./routes/invoices");
const { NotFoundError, BadRequestError } = require("./expressError");


app.use(express.json());
app.use("/companies", compRoute);
app.use("/invoices", invRoute);


/** 404 handler: matches unmatched routes; raises NotFoundError. */
app.use(function (req, res, next) {
  throw new NotFoundError();
});

/** Error handler: logs stacktrace and returns JSON error message. */
app.use(function (err, req, res, next) {
  const status = err.status || 500;
  const message = err.message;
  if (process.env.NODE_ENV !== "test") console.error(status, err.stack);
  return res.status(status).json({ error: { message, status } });
});

module.exports = app;
