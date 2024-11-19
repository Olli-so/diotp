//1. Initialize 
import express from "express";
import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { getEnvs } from "./envs.mjs";
const ENV = getEnvs();
const app = express();

//1.2 Initialize db connection
const DB_CLIENT = new InfluxDB({
    url: ENV.INFLUX.HOST,
    token: ENV.INFLUX.TOKEN
});

const DB_WRITE_POINT = DB_CLIENT.getWriteApi(
    ENV.INFLUX.ORG, 
    ENV.INFLUX.BUCKET
);
DB_WRITE_POINT.useDefaultTags({app: "db_api"});
//Endpoint - embed 
app.get("/api/v1/", (_, res) => res.sendStatus(200))
app.get("/api/v1/embed", async (req,res) => {
    try {
        const value = req.query.value;
        const numeric_value = parseFloat(value);
        const point = new Point("qparams");
        point.floatField("value", numeric_value);
        DB_WRITE_POINT.writePoint(point); // starts transaction
        await DB_WRITE_POINT.flush();
        res.send(`Value: ${value} written`)
    } catch(err) {
        console.error(err);
        res.sendStatus(500);
    }
});
//Endpoint - base
app.get("", (_, res) => res.send("ok"));
//Endpoint - Test query params
app.get("/test", (req,res) => {
    console.log(req.query);
    res.send("Received queryparams!");
});
//2. Operate
app.listen(ENV.PORT, ENV.HOST, () => {
    console.log(`Listening http://${ENV.HOST}:${ENV.PORT}`)
    //3. Cleanup
    // HTTP SERVER.close();
});
