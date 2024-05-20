import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { ELASTICSEARCH_EC2_IP } from "../../common";

// Elasticsearch 검색 결과 타입
interface SearchResponse {
  hits: {
    hits: Array<{
      _source: any; // 검색된 문서의 실제 데이터
    }>;
  };
}

// API 응답 타입
type Data = {
  error?: string;
  data?: any[];
};

const END_POINT = `http://${ELASTICSEARCH_EC2_IP}/koreanaddress/_search`;

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  // 쿼리 파라미터에서 검색어 추출
  const { query } = req.query;

  if (!query) return res.status(400).json({ error: "Query parameter is required." });

  // Elasticsearch 검색 쿼리 생성
  const searchQuery = {
    query: {
      multi_match: {
        query: query,
        fields: [
          "Sido",
          "SidoEng",
          "SigunGu",
          "SigunGuEng",
          "EupMyeon",
          "EupMyeonEng",
          "RoadName",
          "RoadNameEng",
          "RoadNameAddress",
        ],
        type: "best_fields", // 여러 필드에서 최상의 매칭을 찾음
        fuzziness: "AUTO", // 오타에 유연하게 대응
      },
    },
    size: 100,
  };

  // Elasticsearch 검색 요청
  const headers = { headers: { "Content-Type": "application/json" } };
  const data = await axios.post<SearchResponse>(END_POINT, searchQuery, headers).catch(console.error);

  // 결과 반환
  if (!data) return res.status(500).json({ error: "Failed to fetch search results." });
  res.status(200).json({ data: data.data.hits.hits });
}
