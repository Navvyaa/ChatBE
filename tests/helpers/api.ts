import request from "supertest";
import app from "../../src/app";

export const api= (token:string)=>({
    get: (url:string) =>request(app).get(url).set("Authorization", `Bearer ${token}`),
    post: (url:string ,body:object ={}) =>
        request(app).post(url).set("Authorization",`Bearer ${token}`).send(body),
});