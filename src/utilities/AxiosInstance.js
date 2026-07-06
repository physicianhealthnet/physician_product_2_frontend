import axios from "axios";

const AxiosInstance = axios.create({
  // baseURL: "https://demo2.physicianhealthnet.com/api"
  baseURL: "http://localhost:4026"
});

const AxiosInstanceSecondryServer = axios.create({
  // baseURL: "https://dependencyforphn.physicianhealthnet.com/api/"
  baseURL: "http://localhost:3028",
});

const AxiosInstanceDependency = AxiosInstanceSecondryServer;

export { AxiosInstance, AxiosInstanceSecondryServer, AxiosInstanceDependency };
