import request from "supertest";
import app from "../../src/app";

describe("auth rate limiting",()=>{
    const original=process.env.NODE_ENV;
  beforeAll(() => { process.env.NODE_ENV = "development"; }); // re-enables the limiter
  afterAll(() => { process.env.NODE_ENV = original; });
  it("blocks the 6th failed attempt inside the window",async()=>{
    const attempt=()=>
        request(app).post("/api/auth/login").send({email:"bad",password:"bad"});
    for(let i=0;i<5;i++){
        expect((await attempt()).status).toBe(400);
    }
    expect ((await attempt()).status).toBe(429);
  })
})