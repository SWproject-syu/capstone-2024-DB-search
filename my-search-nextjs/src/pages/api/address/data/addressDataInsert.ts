// pages/api/insertHealthData.js
import fs from "fs";
import path from "path";
import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { ELASTICSEARCH_EC2_IP } from "../../common";

// 데이터 넣기 curl -X GET "http://localhost:3001/api/address/data/addressDataInsert"
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

//도로명: 시도+시구군+읍면+도로명+건물번호본번+"-"+건물번호부번
//지번: 시도+시구군+읍면+법정동명+리명+지번본번+"-"+지번부번(0제외)

// 전체 프로퍼티 예시
// 우편번호: 25627
// 시도: 강원특별자치도
// 시도영문: Gangwon-do
// 시군구: 강릉시
// 시군구영문: Gangneung-si
// 읍면: 강동면
// 읍면영문: Gangdong-myeon
// 도로명코드: 511504460360
// 도로명: 둔지길
// 도로명영문: Dunji-gil
// 지하여부: 0
// 건물번호본번: 73
// 건물번호부번: 20
// 건물관리번호: 4215034022105280000000001
// 다량배달처명: (해당 없음)
// 시군구용건물명: (해당 없음)
// 법정동코드: 5115034022
// 법정동명: (해당 없음)
// 리명: 모전리
// 행정동명: 강동면
// 산여부: 0
// 지번본번: 528
// 읍면동일련번호: 01
// 지번부번: 0
// 구우편번호: (해당 없음)
// 우편번호일련번호: (해당 없음)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    for (const fileName of fileNameList) {
      // 파일 경로 설정
      const filePath = path.resolve("./src/pages/api/address/data", fileName);
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
          jihaYeobu,
          buildingMainNumber,
          buildingSubNumber,
          buildingManagementNumber,
          largeDeliveryDestinationName,
          sigunGuBuildingName,
          legalDongCode,
          legalDongName,
          riName,
          administrativeDongName,
          sanYeobu,
          jibunMainNumber,
          eupMyeonDongSerialNumber,
          jibunSubNumber,
          oldPostalCode,
          postalCodeSerialNumber,
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
          LegalDongName: legalDongName,
          RiName: riName,
          AdministrativeDongName: administrativeDongName,
          JibunMainNumber: jibunMainNumber,
          JibunSubNumber: jibunSubNumber,
          JibunAddress: `${sido} ${sigunGu} ${eupMyeon} ${legalDongName} ${riName} ${jibunMainNumber}${
            jibunSubNumber != "0" && jibunSubNumber ? `-${jibunSubNumber}` : ""
          }`,
          RoadNameAddress: `${sido} ${sigunGu} ${eupMyeon} ${roadName} ${buildingMainNumber}${
            buildingSubNumber != "0" && buildingSubNumber ? `-${buildingSubNumber}` : ""
          }`,
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
