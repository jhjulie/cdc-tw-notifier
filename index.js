const moment = require("moment-timezone");
const RssFeedEmitter = require("rss-feed-emitter");
const request = require("request-promise");
const config = require("./configs");
const { rss, notification } = config.address;
const INTERVAL = 10000; // milliseconds

// 程式起始 設定更新時間為現在
let updated_at = moment().tz("Asia/Taipei").format("YYYY-MM-DDTHH:mm:ss");

// 或是指定一個時間
// let updated_at = "2020-04-12";

let newFeeds = [];

setInterval(() => {
  const feeder = new RssFeedEmitter();
  feeder.add({
    url: rss,
  });

  feeder.on("new-item", async function (item) {
    // push進去再另外批次處理 不然一次拿到多筆新聞時 時間判斷會有問題
    newFeeds.push(item);
  });

  feeder.destroy();
}, INTERVAL);

setInterval(() => {
  if (newFeeds.length > 0) {
    let maxPublishdTime = updated_at;

    /**
     * 這個XML裡的更新時間標籤是奇怪的樣子 <a10:updated>2020-04-11T13:43:00+08:00</a10:updated>
     * 被RssFeedEmitter parse過後 會變成更奇怪的樣子 {"a10:updated": {"#": "2020-04-11T13:43:00+08:00"}}
     * 換成其他RSS address會錯 要小心處理
     */

    // 在上次更新時間後的新聞才要處理
    newFeeds = newFeeds.filter((item) => item["a10:updated"]["#"] > updated_at);
    const now = moment().tz("Asia/Taipei").format("YYYY-MM-DDTHH:mm:ss");
    console.log(`\n[${now}] \nlast update: ${updated_at}`);
    console.log(`News: ${newFeeds.length}`);

    newFeeds.forEach((item) => {
      const publish_time = item["a10:updated"]["#"];
      if (publish_time > maxPublishdTime) {
        // 找出這批新聞裡面最大的發布時間
        maxPublishdTime = publish_time;
      }

      const title = `${item.title} (${publish_time.substr(0, 19)})`;
      const text = `${item.description.substr(0, 48)}...`;
      const messageUrl = item.link;

      sendNotification(title, text, messageUrl);

      console.log(`\n${title}`);
      console.log(text);
      console.log(messageUrl);
    });

    // 更新時間設為這批新聞裡面最大的發布時間
    updated_at = maxPublishdTime;

    // 清空
    newFeeds.length = 0;
  }
}, INTERVAL);

const sendNotification = async (title, text, messageUrl) => {
  /**
   * This section must to be customized
   * depends on different message tools.
   */
  const uri = notification.webhook;
  const options = {
    uri,
    method: "POST",
    body: {
      msgtype: "link",
      link: {
        text,
        title,
        picUrl: "",
        messageUrl,
      },
      at: {
        atMobiles: [],
        isAtAll: false,
      },
    },
    json: true,
  };
  const result = await request(options);
  console.log(result);
};
