// pages/api/getSearchDataList.ts
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

const END_POINT = `http://${ELASTICSEARCH_EC2_IP}/campsite/_search`;

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  // 쿼리 파라미터에서 검색어 추출
  const { query } = req.query;

  if (!query) return res.status(400).json({ error: "Query parameter is required." });

  // 검색어를 공백 기준으로 분리하여 각 단어로 검색
  const terms = (query as string).split(" ");

  // Elasticsearch 검색 쿼리 생성
  const searchQuery = {
    query: {
      bool: {
        should: terms.map((term) => ({
          match: {
            Description: {
              query: term,
              fuzziness: "AUTO",
            },
          },
        })),
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
