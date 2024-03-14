// pages/api/getSearchDataList.ts
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { END_POINT } from "./common";

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

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  // 쿼리 파라미터에서 검색어 추출
  const { query } = req.query;

  if (!query) return res.status(400).json({ error: "Query parameter is required." });

  // 가운데 단어를 포함하는 wildcard 쿼리
  const wildcardQuery = {
    wildcard: {
      message: `*${query}*`,
    },
  };

  // 사용자 필드에서 입력된 쿼리로 시작하는 결과를 찾는 prefix 쿼리
  const prefixQuery = {
    prefix: {
      user: query,
    },
  };

  // "bool" 쿼리로 두 가지 다른 쿼리를 "or" 연산자로 결합
  const searchQuery = {
    query: {
      bool: {
        should: [wildcardQuery, prefixQuery],
        minimum_should_match: 1, // 최소한 하나의 쿼리가 일치해야 함
      },
    },
  };
  // Elasticsearch 검색 요청
  const headers = { headers: { "Content-Type": "application/json" } };
  const data = await axios.post<SearchResponse>(END_POINT, searchQuery, headers).catch(console.error);

  // 결과 반환
  if (!data) return res.status(500).json({ error: "Failed to fetch search results." });
  res.status(200).json({ data: data.data.hits.hits });
}
