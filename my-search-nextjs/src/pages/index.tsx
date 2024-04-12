import styles from "@/styles/Home.module.css";
import { Inter } from "next/font/google";
import Head from "next/head";
import { ChangeEventHandler, useState } from "react";

import axios from "axios";
import { MY_BRANCH } from "./api/common";
const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  //입력창에 글자 있는지 여부
  const [isInput, setIsInput] = useState(false);
  //검색결과
  const [searchDataList, setSearchDataList] = useState<any[]>([]);

  const onChangeText: ChangeEventHandler<HTMLInputElement> = async ({ target: { value } }) => {
    setIsInput(value.length > 0);
    if (value.trim()) {
      const data = await axios
        .get<{ data: any[] }>(`/api/getSearchDataListHealthSupplementByName?query=${value}`)
        .catch((e) => console.error("Error fetching search results:", e));
      if (!data) return;
      setSearchDataList(data.data.data);
    } else {
      setSearchDataList([]);
    }
  };

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`} style={{ paddingTop: isInput ? "10vh" : undefined }}>
        <div
          className={`${styles.description} ${!isInput ? styles["description-active"] : ""}`}
          style={{ justifyContent: "space-between" }}
        >
          <p>검색어를 입력하여 검색해보세요. [현재 검색 index: {MY_BRANCH}]</p>
          <div>
            <a href="https://www.syu.ac.kr/cse/" target="_blank" rel="noopener noreferrer">
              By{" "}
              <img
                src="https://www.syu.ac.kr/cse/wp-content/themes/syu-hakbu/images/logo/logo_w.png"
                alt="logo"
                width={100}
                height={24}
              />
              컴퓨터공학부
            </a>
          </div>
        </div>

        <div
          className={styles.center}
          style={{ display: "flex", paddingTop: isInput ? 0 : "25vh", transition: "all 1s ease-out" }}
        >
          <input
            placeholder="검색어를 입력하세요"
            style={{ fontSize: 40, padding: 8, position: "absolute", zIndex: 1, maxWidth: "80vw" }}
            onChange={onChangeText}
          />
        </div>

        <div className={styles.grid} />
        {searchDataList && searchDataList.map((i) => <div>{JSON.stringify(i)}</div>)}
      </main>
    </>
  );
}
