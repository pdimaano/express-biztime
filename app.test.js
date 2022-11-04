"use strict";

const request = require("supertest");
const app = require("./app");
const db = require("./db");

beforeEach(async function () {

  const resp = await db.query(
    `
      DELETE from companies;

      INSERT INTO companies
            VALUES('apple', 'Apple Computer', 'Maker of OSX.'),
                  ('ibm', 'IBM', 'Big blue.');

      INSERT INTO invoices(comp_code, amt, paid, paid_date)
            VALUES('apple', 100, FALSE, NULL),
                  ('apple', 200, FALSE, NULL),
                  ('apple', 300, TRUE, '2018-01-01'),
                  ('ibm', 400, FALSE, NULL);`
  );
});

afterAll(async () => {
  await db.end();
});

describe("GET /companies", function () {

  it("returns a list of all companies", async function () {
    const resp = await request(app).get('/companies');

    expect(resp.body).toEqual({
      "companies": [
        {
          "code": "apple",
          "name": "Apple Computer"
        },
        {
          "code": "ibm",
          "name": "IBM"
        }
      ]
    });

    expect(resp.statusCode).toEqual(200);

  });

});

describe("GET /companies/:code", function () {

  it("returns a single company from the database", async function () {
    const resp = await request(app).get('/companies/apple');


    expect(resp.body).toEqual({
      "company": {
        "code": "apple",
        "name": "Apple Computer",
        "description": "Maker of OSX.",
        "invoices": [
          1,
          2,
          3
        ]
      }
    });
  });

  it("returns a 404 if company not in database", async function () {

    const resp = await request(app).get('/companies/microsoft');

    expect(resp.code).toEqual(404);
  });





})


