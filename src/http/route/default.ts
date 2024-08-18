import express from 'express';

const defaultRoute = express.Router();

defaultRoute.get("/heartbeat", (req, res) => {
    return res.json({
        status: "ok"
    })
})

export default defaultRoute;
