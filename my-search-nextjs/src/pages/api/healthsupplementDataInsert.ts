// pages/api/insertHealthData.js
import fs from "fs";
import path from "path";
import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { ELASTICSEARCH_EC2_IP } from "./common";

// 데이터 비우기 curl -X DELETE "http://43.201.88.182:9200/healthsupplement"
// 데이터 아무거나 3개 가져오기
// curl -X GET "http://43.201.88.182:9200/healthsupplement/_search?size=3" -H 'Content-Type: application/json' -d'
// {
//   "query": {
//     "match_all": {}
//   }
// }'
// 데이터 정보: https://www.notion.so/minsekim1/Elasticsearch-SSH-0e02ccb30d724e6097485997b0ea94dc 참고

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const filePath = path.resolve("./src/pages/api", "healthsupplement-data.json");
    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const BATCH_SIZE = 1000;
    const END_POINT = `http://${ELASTICSEARCH_EC2_IP}/healthsupplement/_bulk`;

    for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
      const batch = jsonData.slice(i, i + BATCH_SIZE);
      let bulkBody = "";

      console.time(`healthsupplement start index:${i}`);
      batch.forEach((doc: any) => {
        bulkBody += JSON.stringify({ index: { _index: "healthsupplement" } }) + "\n";
        bulkBody += JSON.stringify(doc) + "\n";
      });

      await axios.post(END_POINT, bulkBody, {
        headers: { "Content-Type": "application/x-ndjson" },
      });

      console.timeEnd(`healthsupplement start index:${i}`);
    }

    res.status(200).json({ success: true, message: "Data insertion complete." });
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).json({ success: false, error: "Failed to insert data." });
  }
}
