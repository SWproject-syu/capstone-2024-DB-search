//Elasticsearch EC2 고정 IP
const ELASTICSEARCH_EC2_IP = "43.201.88.182:9200";

//자신의 브랜치 이름, 검색 index때도 그대로 활용
export const MY_BRANCH = "test";

export const END_POINT = `http://${ELASTICSEARCH_EC2_IP}/${MY_BRANCH}/_search`;
