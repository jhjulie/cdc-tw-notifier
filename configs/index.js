"use strict";

const config = {
  env: process.env.ENV || "development",
};

let overrides = {};
if (config.env === "development") {
  // local
  require("dotenv").config();
  overrides = require("./config.json");
} else {
  overrides = require(`./config_${config.env}.json`);
}

overrides.address.rss = process.env.RSS_ADDRESS || overrides.address.rss;
overrides.address.notification.webhook = process.env.NOTI_WEBHOOK_URL;

Object.assign(config, overrides);

module.exports = config;
