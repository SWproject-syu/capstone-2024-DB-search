// pages/api/insertHealthData.js
import fs from "fs";
import path from "path";
import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { ELASTICSEARCH_EC2_IP } from "./common";

// 데이터 비우기 curl -X DELETE "http://43.201.88.182:9200/koreanaddress"
// 데이터 아무거나 3개 가져오기
// curl -X GET "http://43.201.88.182:9200/koreanaddress/_search?size=3" -H 'Content-Type: application/json' -d'
// {
//   "query": {
//     "match_all": {}
//   }
// }'
// 데이터 정보: https://www.notion.so/minsekim1/Elasticsearch-SSH-0e02ccb30d724e6097485997b0ea94dc 참고

// 파일 이름 배열
const fileNameList = [
  "경기도.txt",
  "전라남도.txt",
  "경상남도.txt",
  "경상북도.txt",
  "충청남도.txt",
  "충청북도.txt",
  "대구광역시.txt",
  "광주광역시.txt",
  "대전광역시.txt",
  "부산광역시.txt",
  "서울특별시.txt",
  "울산광역시.txt",
  "인천광역시.txt",
  "제주특별자치도.txt",
  "세종특별자치시.txt",
  "강원특별자치도.txt",
  "전북특별자치도.txt",
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    for (const fileName of fileNameList) {
      // 파일 경로 설정
      const filePath = path.resolve("./src/pages/api/address", fileName);
      // 파일 읽기
      const fileContent = fs.readFileSync(filePath, "utf8");
      // 텍스트 데이터를 줄 단위로 분리
      const lines = fileContent.split("\n");
      // 데이터 파싱 및 변환
      const jsonData = lines.map((line) => {
        const [
          postalCode,
          sido,
          sidoEng,
          sigunGu,
          sigunGuEng,
          eupMyeon,
          eupMyeonEng,
          roadNameCode,
          roadName,
          roadNameEng,
          ...rest
        ] = line.split("|");
        return {
          PostalCode: postalCode,
          Sido: sido,
          SidoEng: sidoEng,
          SigunGu: sigunGu,
          SigunGuEng: sigunGuEng,
          EupMyeon: eupMyeon,
          EupMyeonEng: eupMyeonEng,
          RoadName: roadName,
          RoadNameEng: roadNameEng,
        };
      });

      const BATCH_SIZE = 30000;
      const END_POINT = `http://${ELASTICSEARCH_EC2_IP}/koreanaddress/_bulk`;

      // 데이터를 1000개씩 나누어서 Elasticsearch에 벌크 인서트
      for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
        console.time(`${fileName} koreanaddress start index:${i}`);

        const batch = jsonData.slice(i, i + BATCH_SIZE);
        let bulkBody = "";

        batch.forEach((doc) => {
          bulkBody += JSON.stringify({ index: { _index: "koreanaddress" } }) + "\n";
          bulkBody += JSON.stringify(doc) + "\n";
        });

        await axios.post(END_POINT, bulkBody, {
          headers: { "Content-Type": "application/x-ndjson" },
        });
        console.timeEnd(`${fileName} koreanaddress start index:${i}`);
      }
    }

    res.status(200).json({ success: true, message: "Address data insertion complete." });
  } catch (error) {
    console.error("Error inserting address data:", error);
    res.status(500).json({ success: false, error: "Failed to insert address data." });
  }
}
