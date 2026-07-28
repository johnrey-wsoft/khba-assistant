import axios from "axios";

import { SITE_URL } from "@/constants/seo.constant";

export const axiosInstance = axios.create({
  baseURL: SITE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
