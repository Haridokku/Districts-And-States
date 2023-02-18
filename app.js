const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Server Running at localhost://3000/"));
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const stateQuery = `
    SELECT 
      *
    FROM 
      state;`;
  const stateArray = await db.all(stateQuery);
  response.send(stateArray.map((sta) => convertDbObjectToResponseObject(sta)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
    SELECT
      *
    FROM
      state
    WHERE state_id=${stateId};`;
  const state1 = await db.get(stateQuery);
  response.send(convertDbObjectToResponseObject(state1));
});

const convertDistrictObjectToResponseObject = (dist) => {
  return {
    districtId:dist.district_id,
    districtName: dist.district_name,
    stateId: dist.state_id,
    cases: dist.cases,
    cured: dist.cured,
    active: dist.active,
    deaths: dist.deaths,
  };
};
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addQuery = `
    INSERT INTO
      district(district_name,state_id,cases,cured,active,deaths)
    VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const district1 = await db.run(addQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `
    SELECT
      *
    FROM
      district
    WHERE district_id=${districtId};`;
  const district1 = await db.get(districtQuery);
  response.send(convertDistrictObjectToResponseObject(district1));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE
    FROM
      district
    WHERE district_id=${districtId};`;
  await db.run(deleteQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateQuery = `
    UPDATE 
      district
    SET 
      district_name='${districtName}',
      state_id=${stateId},
      cases=${cases},
      cured=${cured},
      active=${active},
      deaths=${deaths}
    WHERE district_id=${districtId};`;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const state2 = `
    SELECT 
    SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths
    FROM district
    WHERE district.state_id=${stateId};`;
  const totalCasesInStates = await db.get(state2);
  response.send(totalCasesInStates);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateQuery = `
    SELECT 
      state_id
    FROM district
    WHERE district.district_id=${districtId};`;
  const statName = await db.get(stateQuery);

  const getStateName = `
  SELECT state_name AS stateName
  FROM state
  WHERE state.state_id=${statName.state_id};`;
  const finalQuery = await db.get(getStateName);
  response.send(finalQuery);
});

module.exports = app;
